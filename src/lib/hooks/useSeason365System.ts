import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Season365ShaderSystem } from '../shaders/Season365ShaderSystem';
import { advanceSeasonClock, seasonDayUniform, seasonTimeUniform } from '../season365Clock';

export function useSeason365System(enabled: boolean = true) {
  const { scene } = useThree();
  const systemRef = useRef<Season365ShaderSystem | null>(null);
  const skyRef = useRef<THREE.Mesh | null>(null);
  const cloudsRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const system = new Season365ShaderSystem();
    systemRef.current = system;

    // 空ドーム
    const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 24, 12), system.skyMaterial);
    sky.frustumCulled = false;
    sky.renderOrder = -2;
    scene.add(sky);
    skyRef.current = sky;

    // 流れる雲
    const CLOUD_COUNT = 200;
    const quad = new THREE.PlaneGeometry(1, 1);
    const cg = new THREE.InstancedBufferGeometry();
    cg.index = quad.index;
    cg.attributes.position = quad.attributes.position;
    cg.attributes.uv = quad.attributes.uv;
    const cseeds = new Float32Array(CLOUD_COUNT * 4);
    for (let i = 0; i < cseeds.length; i++) cseeds[i] = Math.random();
    cg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(cseeds, 4));
    cg.instanceCount = CLOUD_COUNT;
    const clouds = new THREE.Mesh(cg, system.cloudMaterial);
    clouds.frustumCulled = false;
    clouds.renderOrder = -1;
    scene.add(clouds);
    cloudsRef.current = clouds;

    return () => {
      if (skyRef.current) scene.remove(skyRef.current);
      if (cloudsRef.current) scene.remove(cloudsRef.current);
      system.dispose();
      systemRef.current = null;
    };
  }, [scene, enabled]);

  useFrame((_, delta) => {
    if (!systemRef.current || !enabled) return;

    const system = systemRef.current;

    // 共有時計を進める（街の桜並木も同じ値を参照する）。
    // ロード直後などで delta が跳ねても季節がワープしないようクランプする。
    advanceSeasonClock(Math.min(delta, 0.1));

    system.setCurrentDay(seasonDayUniform.value);
    system.setElapsedTime(seasonTimeUniform.value);
  });

  return systemRef.current;
}
