import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { seasonDayUniform, seasonTimeUniform } from "../lib/season365Clock";

// =============================================================
// SakuraTree / SakuraGrove — 街の桜並木（365日高速世界）
//
// sakura.glb は 3 つの独立メッシュを持つ:
//   - bark : 幹（PBR。シーンライトで陰影）
//   - gide : 樹冠のガイド楕円体（描画しない。花/葉パーティクルを詰める体積）
//   - snow : 枝に積もった雪（冬だけ表示）
//
// 頂点数を膨らませないため、葉はメッシュ化せず gide 体積内に散らした
// ビルボード四角形（2Dパーティクル）で表現する。色・サイズは共有時計
// (uCurrentDay) で駆動: 春=桜ピンク → 夏=緑 → 秋=橙 → 冬=落葉(消滅)。
// geometry / material は全ツリーで共有し、1 本あたり 3 ドローコールに抑える。
// =============================================================

const MODEL = "/data/models/merged/sakura.glb";

/** 樹冠に詰める花/葉パーティクル数（1本あたり） */
const CANOPY_COUNT = 520;

// ---- 樹冠シェーダー: uCurrentDay で季節色・サイズ、uTime で風の揺れ ----
const canopyVert = /* glsl */ `
uniform float uCurrentDay;
uniform float uTime;
attribute vec3 aCenter;
attribute vec4 aSeed;
varying vec2  vUv;
varying vec3  vCol;
varying float vFade;
void main() {
    float d  = uCurrentDay;
    float s1 = smoothstep( 60.0, 120.0, d); // 春→夏（緑化）
    float s2 = smoothstep(150.0, 210.0, d); // 夏→秋（紅葉）
    float sF = smoothstep(240.0, 312.0, d); // 落葉（縮小して消える）
    float s4 = smoothstep(340.0, 365.0, d); // →春（再び開花）

    vec3 col = vec3(1.00, 0.72, 0.80);          // 桜ピンク
    col = mix(col, vec3(0.22, 0.58, 0.24), s1); // 新緑
    col = mix(col, vec3(0.90, 0.42, 0.10), s2); // 紅葉
    col = mix(col, vec3(1.00, 0.72, 0.80), s4); // 開花へ戻る
    col *= 0.82 + 0.36 * aSeed.z;               // 個体差
    vCol = col;

    float size = 1.0;
    size = mix(size, 1.12, s1);
    size = mix(size, 0.0,  sF);  // 冬は葉が無い＝枯れ木
    size = mix(size, 1.0,  s4);
    vFade = size;

    // 風の揺れ（uTime 駆動。全体がふわりと揺れる）
    float ph = aSeed.x * 6.28318;
    vec3 sway = vec3(sin(uTime * 1.3 + ph),
                     sin(uTime * 0.9 + ph * 1.7) * 0.4,
                     cos(uTime * 1.1 + ph)) * 0.045;
    vec3 c = aCenter + sway;

    // ビュー空間ビルボード
    vec4 mv = modelViewMatrix * vec4(c, 1.0);
    float sz = (0.14 + aSeed.w * 0.12) * size;
    mv.xy += position.xy * sz;

    vUv = uv;
    gl_Position = projectionMatrix * mv;
}`;

const canopyFrag = /* glsl */ `
varying vec2  vUv;
varying vec3  vCol;
varying float vFade;
void main() {
    if (vFade < 0.02) discard;
    vec2 p = vUv * 2.0 - 1.0;
    float r = dot(p, p);
    if (r > 1.0) discard;            // 丸い花房。discard で不透明扱い（ソート不要）
    float shade = 0.72 + 0.28 * (1.0 - r);
    gl_FragColor = vec4(vCol * shade, 1.0);
}`;

// ---- 雪シェーダー: uCurrentDay で冬だけ現れる。JS更新不要 ----
const snowVert = /* glsl */ `
uniform float uCurrentDay;
varying float vSnow;
varying vec3  vN;
void main() {
    float d = uCurrentDay;
    vSnow = smoothstep(272.0, 300.0, d) * (1.0 - smoothstep(350.0, 364.0, d));
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const snowFrag = /* glsl */ `
varying float vSnow;
varying vec3  vN;
void main() {
    if (vSnow < 0.01) discard;
    float up  = clamp(vN.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 col  = mix(vec3(0.60, 0.66, 0.82), vec3(0.97, 0.98, 1.00), up);
    gl_FragColor = vec4(col, vSnow * 0.96);
}`;

interface SharedTreeAssets {
  barkGeo: THREE.BufferGeometry;
  barkMat: THREE.Material;
  barkT: { position: [number, number, number]; scale: [number, number, number] };
  snowGeo: THREE.BufferGeometry;
  snowT: { position: [number, number, number]; scale: [number, number, number] };
  canopyGeo: THREE.InstancedBufferGeometry;
  canopyMat: THREE.ShaderMaterial;
  snowMat: THREE.ShaderMaterial;
}

function nodeTRS(o: THREE.Object3D) {
  return {
    position: [o.position.x, o.position.y, o.position.z] as [number, number, number],
    scale: [o.scale.x, o.scale.y, o.scale.z] as [number, number, number],
  };
}

/** gide 楕円体の内部に一様分布するパーティクル中心を生成 */
function buildCanopyGeometry(gide: THREE.Mesh, count: number): THREE.InstancedBufferGeometry {
  gide.geometry.computeBoundingBox();
  const bb = gide.geometry.boundingBox!;
  const s = gide.scale;
  const p = gide.position;
  // gide のローカル bbox に node の TRS を適用（回転なし）
  const cx = p.x + s.x * (bb.min.x + bb.max.x) * 0.5;
  const cy = p.y + s.y * (bb.min.y + bb.max.y) * 0.5;
  const cz = p.z + s.z * (bb.min.z + bb.max.z) * 0.5;
  const rx = s.x * (bb.max.x - bb.min.x) * 0.5 * 0.92;
  const ry = s.y * (bb.max.y - bb.min.y) * 0.5 * 0.92;
  const rz = s.z * (bb.max.z - bb.min.z) * 0.5 * 0.92;

  const centers = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    // 単位球内で棄却サンプリング → 楕円体へスケール
    let x = 0, y = 0, z = 0;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
    } while (x * x + y * y + z * z > 1);
    centers[i * 3 + 0] = cx + x * rx;
    centers[i * 3 + 1] = cy + y * ry;
    centers[i * 3 + 2] = cz + z * rz;
    seeds[i * 4 + 0] = Math.random();
    seeds[i * 4 + 1] = Math.random();
    seeds[i * 4 + 2] = Math.random();
    seeds[i * 4 + 3] = Math.random();
  }

  const quad = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.index = quad.index;
  g.attributes.position = quad.attributes.position;
  g.attributes.uv = quad.attributes.uv;
  g.setAttribute("aCenter", new THREE.InstancedBufferAttribute(centers, 3));
  g.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
  g.instanceCount = count;
  // ビルボードは frustumCulled=false で扱うため境界球は不要
  return g;
}

/** gltf から共有アセット（geometry / material）を一度だけ構築 */
function useSharedTreeAssets(): SharedTreeAssets {
  const { nodes, materials } = useGLTF(MODEL) as unknown as {
    nodes: Record<string, THREE.Mesh>;
    materials: Record<string, THREE.Material>;
  };

  return useMemo<SharedTreeAssets>(() => {
    const bark = nodes.bark;
    const gide = nodes.gide;
    const snow = nodes.snow;

    const canopyMat = new THREE.ShaderMaterial({
      uniforms: { uCurrentDay: seasonDayUniform, uTime: seasonTimeUniform },
      vertexShader: canopyVert,
      fragmentShader: canopyFrag,
      side: THREE.DoubleSide,
      // discard による不透明描画（transparent 無し）でソート不要・自然な樹冠
    });

    const snowMat = new THREE.ShaderMaterial({
      uniforms: { uCurrentDay: seasonDayUniform },
      vertexShader: snowVert,
      fragmentShader: snowFrag,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });

    return {
      barkGeo: bark.geometry,
      barkMat: materials.bark,
      barkT: nodeTRS(bark),
      snowGeo: snow.geometry,
      snowT: nodeTRS(snow),
      canopyGeo: buildCanopyGeometry(gide, CANOPY_COUNT),
      canopyMat,
      snowMat,
    };
  }, [nodes, materials]);
}

interface SakuraTreeProps {
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  assets: SharedTreeAssets;
}

function SakuraTree({ position, rotationY = 0, scale = 1, assets }: SakuraTreeProps) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* 幹（PBR。影を落とす/受ける） */}
      <mesh
        geometry={assets.barkGeo}
        material={assets.barkMat}
        position={assets.barkT.position}
        scale={assets.barkT.scale}
        castShadow
        receiveShadow
      />
      {/* 樹冠パーティクル（gide 体積内・ビルボード。frustumCulled 無効） */}
      <mesh geometry={assets.canopyGeo} material={assets.canopyMat} frustumCulled={false} />
      {/* 積雪（冬のみシェーダーで出現） */}
      <mesh
        geometry={assets.snowGeo}
        material={assets.snowMat}
        position={assets.snowT.position}
        scale={assets.snowT.scale}
      />
    </group>
  );
}

interface GroveItem {
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
}

// 道路の両脇に配置（建物・電柱・ドアトリガーを避ける）
const GROVE: GroveItem[] = [
  { position: [-5.5, 0, -6], rotationY: 0.4, scale: 1.7 },
  { position: [-5.5, 0, -13], rotationY: 2.1, scale: 1.5 },
  { position: [-5.5, 0, -20], rotationY: 4.0, scale: 1.8 },
  { position: [5.5, 0, -6], rotationY: 1.2, scale: 1.6 },
  { position: [5.5, 0, -20], rotationY: 3.3, scale: 1.7 },
];

/** 街に桜並木を配置する。GameScene の <Street> と併せて使う。 */
export function SakuraGrove() {
  const assets = useSharedTreeAssets();
  return (
    <group>
      {GROVE.map((t, i) => (
        <SakuraTree
          key={i}
          position={t.position}
          rotationY={t.rotationY}
          scale={t.scale}
          assets={assets}
        />
      ))}
    </group>
  );
}

useGLTF.preload(MODEL);
