import * as THREE from 'three';

/* ================= Season365 シェーダーシステム ================= */

const groundVert = /* glsl */ `
uniform float uCurrentDay;
uniform float uTimeSpeed;
varying vec2 vUv; varying vec3 vNormal;
varying vec3 vPlantCol; varying vec3 vGroundCol;
varying vec3 vLightDir; varying vec3 vLightCol; varying vec3 vParams;
void main() {
    vUv = uv;
    vNormal = mat3(modelMatrix) * normal;
    float d  = uCurrentDay;
    float s1 = smoothstep( 60.0, 120.0, d);
    float s2 = smoothstep(150.0, 210.0, d);
    float s3 = smoothstep(240.0, 300.0, d);
    float s4 = smoothstep(330.0, 365.0, d);
    vec3 plant = vec3(0.36, 0.76, 0.28);
    plant = mix(plant, vec3(0.08, 0.42, 0.13), s1);
    plant = mix(plant, vec3(0.78, 0.38, 0.08), s2);
    plant = mix(plant, vec3(0.46, 0.42, 0.36), s3);
    plant = mix(plant, vec3(0.36, 0.76, 0.28), s4);
    vec3 ground = vec3(0.38, 0.32, 0.22);
    ground = mix(ground, vec3(0.34, 0.28, 0.18), s1);
    ground = mix(ground, vec3(0.42, 0.30, 0.16), s2);
    ground = mix(ground, vec3(0.36, 0.36, 0.40), s3);
    ground = mix(ground, vec3(0.38, 0.32, 0.22), s4);
    vec3 ldir = vec3(0.35, 0.90, 0.30);
    ldir = mix(ldir, vec3(0.10, 1.00, 0.20), s1);
    ldir = mix(ldir, vec3(0.85, 0.40, 0.30), s2);
    ldir = mix(ldir, vec3(0.90, 0.30, 0.20), s3);
    ldir = mix(ldir, vec3(0.35, 0.90, 0.30), s4);
    vLightDir = normalize(ldir);
    vec3 lcol = vec3(1.00, 0.98, 0.90);
    lcol = mix(lcol, vec3(1.15, 1.12, 1.02), s1);
    lcol = mix(lcol, vec3(1.00, 0.62, 0.32), s2);
    lcol = mix(lcol, vec3(0.62, 0.68, 0.80), s3);
    lcol = mix(lcol, vec3(1.00, 0.98, 0.90), s4);
    vLightCol = lcol;
    float winterW = s3 * (1.0 - s4);
    float summerW = s1 * (1.0 - s2);
    float ambient = 0.34;
    ambient = mix(ambient, 0.28, s1);
    ambient = mix(ambient, 0.30, s2);
    ambient = mix(ambient, 0.48, s3);
    ambient = mix(ambient, 0.34, s4);
    vPlantCol = plant; vGroundCol = ground;
    vParams = vec3(winterW, summerW, ambient);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const groundFrag = /* glsl */ `
uniform sampler2D uMaskTex;
varying vec2 vUv; varying vec3 vNormal;
varying vec3 vPlantCol; varying vec3 vGroundCol;
varying vec3 vLightDir; varying vec3 vLightCol; varying vec3 vParams;
void main() {
    float mask = texture2D(uMaskTex, vUv).r;
    vec3 albedo = mix(vGroundCol, vPlantCol, mask);
    vec3 punch = albedo * albedo * (3.0 - 2.0 * albedo);
    albedo = mix(albedo, punch, vParams.y * 0.65);
    float invLen = inversesqrt(dot(vNormal, vNormal));
    float snow = vParams.x * smoothstep(0.35, 0.85, vNormal.y * invLen);
    albedo = mix(albedo, vec3(0.92, 0.94, 1.00), snow);
    float diff = clamp(dot(vNormal, vLightDir) * invLen, 0.0, 1.0);
    gl_FragColor = vec4(albedo * (vLightCol * diff + vParams.z), 1.0);
}`;

const canopyVert = /* glsl */ `
uniform float uCurrentDay;
varying vec3 vNormal; varying vec3 vLeafCol;
varying vec3 vLightDir; varying vec3 vLightCol; varying float vAmbient;
void main() {
    float d  = uCurrentDay;
    float s1 = smoothstep( 60.0, 120.0, d);
    float s2 = smoothstep(150.0, 210.0, d);
    float sF = smoothstep(240.0, 310.0, d);
    float s4 = smoothstep(340.0, 365.0, d);
    vec3 leaf = vec3(1.00, 0.72, 0.80);
    leaf = mix(leaf, vec3(0.18, 0.55, 0.20), s1);
    leaf = mix(leaf, vec3(0.85, 0.30, 0.10), s2);
    leaf = mix(leaf, vec3(1.00, 0.72, 0.80), s4);
    vLeafCol = leaf;
    float size = 1.0;
    size = mix(size, 1.15, s1);
    size = mix(size, 0.0,  sF);
    size = mix(size, 1.0,  s4);
    vec3 pos = position * size;
    vec3 ldir = vec3(0.35, 0.90, 0.30);
    ldir = mix(ldir, vec3(0.10, 1.00, 0.20), s1);
    ldir = mix(ldir, vec3(0.85, 0.40, 0.30), s2);
    ldir = mix(ldir, vec3(0.90, 0.30, 0.20), smoothstep(240.0, 300.0, d));
    ldir = mix(ldir, vec3(0.35, 0.90, 0.30), s4);
    vLightDir = normalize(ldir);
    vec3 lcol = vec3(1.00, 0.98, 0.90);
    lcol = mix(lcol, vec3(1.15, 1.12, 1.02), s1);
    lcol = mix(lcol, vec3(1.00, 0.62, 0.32), s2);
    lcol = mix(lcol, vec3(1.00, 0.98, 0.90), s4);
    vLightCol = lcol;
    vAmbient = mix(0.40, 0.30, s1);
    vNormal = mat3(modelMatrix) * normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const canopyFrag = /* glsl */ `
varying vec3 vNormal; varying vec3 vLeafCol;
varying vec3 vLightDir; varying vec3 vLightCol; varying float vAmbient;
void main() {
    float invLen = inversesqrt(dot(vNormal, vNormal));
    float diff = clamp(dot(vNormal, vLightDir) * invLen * 0.5 + 0.5, 0.0, 1.0);
    gl_FragColor = vec4(vLeafCol * (vLightCol * diff + vAmbient), 1.0);
}`;

const petalVert = /* glsl */ `
uniform float uCurrentDay;
uniform float uTime;
uniform vec3  uWindDir;
uniform float uWindStrength;
uniform vec3  uCenter;
uniform float uAreaSize;
uniform float uFallHeight;
attribute vec4 aSeed;
varying vec2  vUv;
varying vec3  vColor;
varying float vAlpha;
varying float vSnowW;

vec3 windField(vec3 p, float t) {
    float g1 = sin(t * 0.50 + p.x * 0.15 + p.z * 0.10);
    float g2 = sin(t * 1.30 + p.z * 0.45 - p.y * 0.30 + 2.1);
    float g3 = sin(t * 3.10 + p.x * 1.10 + 4.7);
    float gustBase = sin(t * 0.23) * 0.5 + 0.5;
    float gust = gustBase * gustBase; gust *= gust;
    vec3 side = vec3(-uWindDir.z, 0.0, uWindDir.x);
    return uWindDir * (1.0 + g1 * 0.6 + gust * 1.8)
         + side    * (g2 * 0.8)
         + vec3(0.0, g3 * 0.25 + g1 * 0.15, 0.0);
}

void main() {
    float d = uCurrentDay;
    float petalW = smoothstep( 15.0,  40.0, d) * (1.0 - smoothstep( 75.0, 110.0, d));
    float leafW  = smoothstep(205.0, 240.0, d) * (1.0 - smoothstep(285.0, 315.0, d));
    float snowW  = smoothstep(275.0, 305.0, d) * (1.0 - smoothstep(345.0, 362.0, d));
    float activeW = clamp(petalW + leafW + snowW, 0.0, 1.0);
    vSnowW = snowW;

    float t  = uTime;
    float ph = aSeed.x * 6.28318;
    float spd = 0.6 + aSeed.y * 0.8;
    float fallSpd = 1.6 * petalW + 1.2 * leafW + 0.45 * snowW + 1.0 * (1.0 - activeW);

    vec3 base = vec3(aSeed.x, aSeed.y, aSeed.z) * uAreaSize;
    vec3 drift = uWindDir * (uWindStrength * spd * t * 2.0);
    vec3 wp;
    wp.x = mod(base.x + drift.x, uAreaSize);
    wp.z = mod(base.z + drift.z, uAreaSize);
    wp.y = mod(base.y + aSeed.w * uFallHeight - t * fallSpd * spd, uFallHeight);
    vec3 pos = wp - vec3(uAreaSize * 0.5, 0.0, uAreaSize * 0.5) + uCenter;

    vec3 gustVec = windField(pos, t + ph);
    pos += gustVec * uWindStrength * mix(0.55, 0.9, snowW);

    float tumbleSpd = mix(3.5, 0.8, snowW) * spd;
    float a1 = t * tumbleSpd + ph;
    float a2 = t * tumbleSpd * 0.63 + ph * 2.0;
    float c1 = cos(a1), s1 = sin(a1);
    float c2 = cos(a2), s2 = sin(a2);
    vec3 v = position;
    v = vec3(v.x, v.y * c1 - v.z * s1, v.y * s1 + v.z * c1);
    v = vec3(v.x * c2 + v.z * s2, v.y, -v.x * s2 + v.z * c2);

    float size = (0.09 * petalW + 0.13 * leafW + 0.05 * snowW)
               * (0.7 + aSeed.z * 0.6);
    pos += v * size * step(0.001, activeW) * activeW;

    vec3 col = vec3(1.00, 0.80, 0.88) * petalW
             + vec3(0.88, 0.40, 0.10) * leafW
             + vec3(1.00, 1.00, 1.00) * snowW;
    col *= 0.75 + 0.25 * c1 * c1;
    vColor = col;

    vAlpha = activeW
           * smoothstep(0.0, 0.6, wp.y)
           * (1.0 - smoothstep(uFallHeight - 0.8, uFallHeight, wp.y));

    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const petalFrag = /* glsl */ `
varying vec2  vUv;
varying vec3  vColor;
varying float vAlpha;
varying float vSnowW;
void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float body  = 1.0 - (p.x * p.x * 1.6 + p.y * p.y * 0.8);
    float notch = 1.0 - (p.x * p.x * 14.0 + (p.y - 1.05) * (p.y - 1.05) * 3.0);
    float petalShape = clamp(body, 0.0, 1.0) * (1.0 - clamp(notch, 0.0, 1.0));
    float snowShape = 1.0 - dot(p, p);
    float shape = mix(petalShape, snowShape, vSnowW);
    float alpha = smoothstep(0.02, 0.25, shape) * vAlpha;
    vec3 col = vColor * (0.9 + 0.15 * vUv.y);
    gl_FragColor = vec4(col, alpha);
}`;

const skyVert = /* glsl */ `
varying vec3 vDir;
void main() {
    vDir = position;
    vec4 mv = modelViewMatrix * vec4(position, 0.0);
    gl_Position = (projectionMatrix * vec4(mv.xyz, 1.0)).xyww;
}`;

const skyFrag = /* glsl */ `
uniform float uCurrentDay;
varying vec3 vDir;
float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
    vec3 dir = normalize(vDir);
    float d  = uCurrentDay;
    float s1 = smoothstep( 60.0, 120.0, d);
    float s2 = smoothstep(150.0, 210.0, d);
    float s3 = smoothstep(240.0, 300.0, d);
    float s4 = smoothstep(330.0, 365.0, d);

    vec3 zen = vec3(0.28, 0.32, 0.55);
    zen = mix(zen, vec3(0.25, 0.50, 0.85), s1);
    zen = mix(zen, vec3(0.13, 0.13, 0.32), s2);
    zen = mix(zen, vec3(0.03, 0.04, 0.11), s3);
    zen = mix(zen, vec3(0.28, 0.32, 0.55), s4);

    vec3 hor = vec3(0.95, 0.62, 0.58);
    hor = mix(hor, vec3(0.98, 0.85, 0.60), s1);
    hor = mix(hor, vec3(0.98, 0.42, 0.12), s2);
    hor = mix(hor, vec3(0.28, 0.18, 0.34), s3);
    hor = mix(hor, vec3(0.95, 0.62, 0.58), s4);

    float h = clamp(dir.y, 0.0, 1.0);
    float grad = h * h * (3.0 - 2.0 * h);
    vec3 sky = mix(hor, zen, grad);

    float sunEl = 0.16;
    sunEl = mix(sunEl, 0.38, s1);
    sunEl = mix(sunEl, 0.06, s2);
    sunEl = mix(sunEl, -0.06, s3);
    sunEl = mix(sunEl, 0.16, s4);
    vec3 sunDir = normalize(vec3(-0.85, sunEl, -0.35));

    vec3 sunCol = vec3(1.00, 0.80, 0.55);
    sunCol = mix(sunCol, vec3(1.00, 0.95, 0.80), s1);
    sunCol = mix(sunCol, vec3(1.00, 0.45, 0.10), s2);
    sunCol = mix(sunCol, vec3(0.55, 0.35, 0.45), s3);
    sunCol = mix(sunCol, vec3(1.00, 0.80, 0.55), s4);

    float g  = clamp(dot(dir, sunDir), 0.0, 1.0);
    float g2 = g * g;
    float g8 = g2 * g2; g8 *= g8;
    float g32 = g8 * g8;
    sky += sunCol * (g2 * 0.25 + g8 * 0.5 + g32 * g32 * 2.0);

    float darkness = s3 * (1.0 - s4);
    vec2 grid = floor(dir.xz / max(dir.y, 0.02) * 24.0);
    float star = step(0.985, hash21(grid));
    star *= 0.5 + 0.5 * sin(d * 3.0 + hash21(grid + 7.0) * 6.28);
    sky += vec3(0.9, 0.95, 1.0) * star * darkness * smoothstep(0.15, 0.5, dir.y);

    gl_FragColor = vec4(sky, 1.0);
}`;

const cloudVert = /* glsl */ `
uniform float uCurrentDay;
uniform float uCloudSpeed;
uniform float uSpan;
uniform float uAltitude;
attribute vec4 aSeed;
varying vec2  vUv;
varying vec3  vCloudCol;
varying float vAlpha;
varying float vPhase;
void main() {
    float d = uCurrentDay;
    float s1 = smoothstep( 60.0, 120.0, d);
    float s2 = smoothstep(150.0, 210.0, d);
    float s3 = smoothstep(240.0, 300.0, d);
    float s4 = smoothstep(330.0, 365.0, d);

    float spd = uCloudSpeed * (0.6 + aSeed.w * 0.8);
    vec3 center = vec3(
        mod(aSeed.x * uSpan + d * spd, uSpan) - uSpan * 0.5,
        uAltitude + (aSeed.y - 0.5) * uAltitude * 0.5,
        (aSeed.z - 0.5) * uSpan
    );

    vec3 col = vec3(0.98, 0.80, 0.78);
    col = mix(col, vec3(1.00, 0.96, 0.90), s1);
    col = mix(col, vec3(1.00, 0.55, 0.25), s2);
    col = mix(col, vec3(0.16, 0.15, 0.24), s3);
    col = mix(col, vec3(0.98, 0.80, 0.78), s4);
    vCloudCol = col;

    float amount = 0.75;
    amount = mix(amount, 0.95, s1);
    amount = mix(amount, 0.55, s2);
    amount = mix(amount, 0.85, s3);
    amount = mix(amount, 0.75, s4);
    float edge = smoothstep(0.0, uSpan * 0.12, center.x + uSpan * 0.5)
               * (1.0 - smoothstep(uSpan * 0.38, uSpan * 0.5, center.x));
    vAlpha = amount * edge * (0.55 + aSeed.y * 0.3);

    vPhase = aSeed.x * 37.0;
    vUv = uv;

    float size = (10.0 + aSeed.y * 22.0);
    vec4 mv = modelViewMatrix * vec4(center, 1.0);
    mv.xy += position.xy * vec2(size * 1.9, size * 0.8);
    gl_Position = projectionMatrix * mv;
}`;

const cloudFrag = /* glsl */ `
varying vec2  vUv;
varying vec3  vCloudCol;
varying float vAlpha;
varying float vPhase;
void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float body = 1.0 - dot(p * vec2(1.0, 1.5), p * vec2(1.0, 1.5));
    float lump = sin(p.x * 4.5 + vPhase) * sin(p.x * 2.3 + vPhase * 1.7 + p.y * 3.0);
    float shape = body + lump * 0.22 - 0.05;
    shape *= smoothstep(-1.0, -0.35, p.y);
    float alpha = smoothstep(0.0, 0.45, shape) * vAlpha;
    vec3 col = vCloudCol * (0.88 + 0.18 * vUv.y);
    gl_FragColor = vec4(col, alpha);
}`;

export class Season365ShaderSystem {
  dayUniform: { value: number };
  timeUniform: { value: number };
  windDirUniform: { value: THREE.Vector3 };
  windStrengthUniform: { value: number };
  maskTexture: THREE.CanvasTexture;

  groundMaterial: THREE.ShaderMaterial;
  canopyMaterial: THREE.ShaderMaterial;
  petalMaterial: THREE.ShaderMaterial;
  skyMaterial: THREE.ShaderMaterial;
  cloudMaterial: THREE.ShaderMaterial;

  constructor() {
    this.dayUniform = { value: 0.0 };
    this.timeUniform = { value: 0.0 };
    this.windDirUniform = { value: new THREE.Vector3(1, 0, 0.3).normalize() };
    this.windStrengthUniform = { value: 1.0 };
    this.maskTexture = this.createMaskTexture();

    this.groundMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uCurrentDay: this.dayUniform,
        uTimeSpeed: { value: 60.0 },
        uMaskTex: { value: this.maskTexture },
      },
      vertexShader: groundVert,
      fragmentShader: groundFrag,
      precision: 'mediump',
      fog: false,
      lights: false,
    });

    this.canopyMaterial = new THREE.ShaderMaterial({
      uniforms: { uCurrentDay: this.dayUniform },
      vertexShader: canopyVert,
      fragmentShader: canopyFrag,
      precision: 'mediump',
      fog: false,
      lights: false,
    });

    this.skyMaterial = new THREE.ShaderMaterial({
      uniforms: { uCurrentDay: this.dayUniform },
      vertexShader: skyVert,
      fragmentShader: skyFrag,
      precision: 'mediump',
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.petalMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uCurrentDay: this.dayUniform,
        uTime: this.timeUniform,
        uWindDir: this.windDirUniform,
        uWindStrength: this.windStrengthUniform,
        uCenter: { value: new THREE.Vector3(0, 0, 0) },
        uAreaSize: { value: 30 },
        uFallHeight: { value: 12 },
      },
      vertexShader: petalVert,
      fragmentShader: petalFrag,
      precision: 'mediump',
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.cloudMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uCurrentDay: this.dayUniform,
        uCloudSpeed: { value: 3.0 },
        uSpan: { value: 400 },
        uAltitude: { value: 60 },
      },
      vertexShader: cloudVert,
      fragmentShader: cloudFrag,
      precision: 'mediump',
      transparent: true,
      depthWrite: false,
    });
  }

  private createMaskTexture(size = 256): THREE.CanvasTexture {
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * size,
        y = Math.random() * size;
      const r = 2 + Math.random() * 9;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 6.283);
      ctx.fill();
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 16, 16);
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
  }

  setCurrentDay(day: number): void {
    this.dayUniform.value = day % 365.0;
  }

  setElapsedTime(time: number): void {
    this.timeUniform.value = time;
  }

  setWindDirection(dir: THREE.Vector3): void {
    this.windDirUniform.value.copy(dir);
  }

  setWindStrength(strength: number): void {
    this.windStrengthUniform.value = strength;
  }

  getSeasonName(day: number): string {
    day = day % 365.0;
    if (day < 91) return '春: 桜満開・花吹雪';
    if (day < 181) return '夏: 新緑';
    if (day < 271) return '秋: 紅葉・落葉';
    return '冬: 枯れ木・雪';
  }

  dispose(): void {
    this.groundMaterial.dispose();
    this.canopyMaterial.dispose();
    this.petalMaterial.dispose();
    this.skyMaterial.dispose();
    this.cloudMaterial.dispose();
    this.maskTexture.dispose();
  }
}
