/* ==========================================================================
   MORZEN INDUSTRIES — Cinematic 3D Loading Screen
   Stack: Three.js + React Three Fiber + GSAP
   Uses the exact supplied company logo (gallery/logo-mark.png & logo-wordmark.png)
   ========================================================================== */

import React, { useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

function createSoftParticleTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255, 236, 178, 1)");
  grad.addColorStop(0.32, "rgba(218, 168, 62, 0.85)");
  grad.addColorStop(0.7, "rgba(212, 162, 55, 0.22)");
  grad.addColorStop(1, "rgba(212, 162, 55, 0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createStudioEnv(gl) {
  const pmrem = new THREE.PMREMGenerator(gl);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x090a0d);

  const warmPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 6),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffd77a).multiplyScalar(2.4), side: THREE.DoubleSide })
  );
  warmPanel.position.set(4.5, 3.2, 4.5);
  warmPanel.lookAt(0, 0, 0);
  envScene.add(warmPanel);

  const coolPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8aa0bc).multiplyScalar(1.3), side: THREE.DoubleSide })
  );
  coolPanel.position.set(-5.0, -1.5, 4.0);
  coolPanel.lookAt(0, 0, 0);
  envScene.add(coolPanel);

  const rimPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 3),
    new THREE.MeshBasicMaterial({ color: new THREE.Color(0xd4a237).multiplyScalar(2.0), side: THREE.DoubleSide })
  );
  rimPanel.position.set(0, 5.5, -3.5);
  rimPanel.lookAt(0, 0, 0);
  envScene.add(rimPanel);

  const rt = pmrem.fromScene(envScene, 0.04);
  pmrem.dispose();
  return rt.texture;
}

function createRoundedHexShape(radius, cornerRadius) {
  const shape = new THREE.Shape();
  const pts = [];
  for (let i = 0; i < 6; i += 1) {
    // Point-top hexagon matching gallery/logo-mark.png orientation
    const angle = (Math.PI / 3) * i + Math.PI / 2;
    pts.push(new THREE.Vector2(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  for (let i = 0; i < 6; i += 1) {
    const prev = pts[(i + 5) % 6];
    const curr = pts[i];
    const next = pts[(i + 1) % 6];
    const v1 = prev.clone().sub(curr).normalize().multiplyScalar(cornerRadius);
    const v2 = next.clone().sub(curr).normalize().multiplyScalar(cornerRadius);
    const start = curr.clone().add(v1);
    const end = curr.clone().add(v2);
    if (i === 0) shape.moveTo(start.x, start.y);
    else shape.lineTo(start.x, start.y);
    shape.quadraticCurveTo(curr.x, curr.y, end.x, end.y);
  }
  shape.closePath();
  return shape;
}

function ConvergingParticles({ animState }) {
  const pointsRef = useRef();
  const count = 260;

  const { origins, speeds, phases, particleTexture } = useMemo(() => {
    const orig = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const ph = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 3.8 + Math.random() * 5.2;
      orig[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      orig[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius * 0.72;
      orig[i * 3 + 2] = Math.cos(phi) * radius * 0.65 - 1.2;
      spd[i] = 0.65 + Math.random() * 0.85;
      ph[i] = Math.random() * Math.PI * 2;
    }
    return {
      origins: orig,
      speeds: spd,
      phases: ph,
      particleTexture: createSoftParticleTexture()
    };
  }, []);

  const positions = useMemo(() => new Float32Array(origins), [origins]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.getElapsedTime();
    const converge = animState.current.converge; // 0 -> 1
    const attr = pointsRef.current.geometry.attributes.position;
    const arr = attr.array;

    for (let i = 0; i < count; i += 1) {
      const idx = i * 3;
      const ox = origins[idx];
      const oy = origins[idx + 1];
      const oz = origins[idx + 2];
      const p = Math.min(1, Math.max(0, converge * speeds[i]));
      const swirl = (1 - p) * 1.35 + t * 0.16;
      const cosS = Math.cos(swirl * 0.35);
      const sinS = Math.sin(swirl * 0.35);

      const targetRadius = 0.45 + (i % 19) * 0.085;
      const len = Math.hypot(ox, oy) || 1;
      const tx = (ox / len) * targetRadius;
      const ty = (oy / len) * targetRadius;
      const tz = -0.3 + Math.sin(t * 0.9 + phases[i]) * 0.25;

      const x = THREE.MathUtils.lerp(ox, tx, p);
      const y = THREE.MathUtils.lerp(oy, ty, p);
      const z = THREE.MathUtils.lerp(oz, tz, p);

      arr[idx] = x * cosS - z * sinS * 0.18 + Math.sin(t + phases[i]) * 0.04;
      arr[idx + 1] = y + Math.cos(t * 0.8 + phases[i]) * 0.04;
      arr[idx + 2] = z;
    }
    attr.needsUpdate = true;
    pointsRef.current.rotation.z = t * 0.03;
  });

  return React.createElement(
    "points",
    { ref: pointsRef },
    React.createElement(
      "bufferGeometry",
      null,
      React.createElement("bufferAttribute", {
        attach: "attributes-position",
        count,
        array: positions,
        itemSize: 3
      })
    ),
    React.createElement("pointsMaterial", {
      map: particleTexture,
      size: 0.14,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: "#efc463"
    })
  );
}

function HexEmblem({ animState }) {
  const groupRef = useRef();
  const sweepLightRef = useRef();
  const rimMatRef = useRef();
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    const env = createStudioEnv(gl);
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
    };
  }, [gl, scene]);

  const hexGeo = useMemo(() => {
    const shape = createRoundedHexShape(1.06, 0.14);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.2,
      bevelEnabled: true,
      bevelSegments: 5,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.07
    });
    geo.center();
    return geo;
  }, []);

  const goldRimGeo = useMemo(() => {
    const outer = createRoundedHexShape(1.13, 0.15);
    const hole = createRoundedHexShape(1.065, 0.14);
    outer.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(outer, {
      depth: 0.05,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.02
    });
    geo.center();
    return geo;
  }, []);

  const logoShaderMat = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load("gallery/logo-mark.png");
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;

    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTex: { value: tex },
        uAssemble: { value: 0 },
        uSweep: { value: -0.6 },
        uGlow: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTex;
        uniform float uAssemble;
        uniform float uSweep;
        uniform float uGlow;
        varying vec2 vUv;

        void main() {
          vec4 texel = texture2D(uTex, vUv);
          if (texel.a < 0.04) discard;

          // Detect gold monogram vs charcoal hex body
          float isGold = smoothstep(0.18, 0.42, texel.r - texel.b * 0.6);

          // Metallic assembly mask: charcoal base appears first, gold Mi assembles radially + vertically
          float distCenter = length(vUv - vec2(0.5, 0.5));
          float assembleWave = smoothstep(uAssemble * 1.35 - 0.25, uAssemble * 1.35, distCenter * 0.7 + (1.0 - vUv.y) * 0.45);
          float goldMask = 1.0 - assembleWave;

          // Diagonal golden sweep light across Mi surface
          float diag = (vUv.x * 0.72 + vUv.y * 0.68);
          float beam = exp(-pow((diag - uSweep) * 9.5, 2.0));

          vec3 col = texel.rgb;
          col += isGold * beam * vec3(0.45, 0.36, 0.14);
          col += isGold * uGlow * vec3(0.28, 0.21, 0.06);

          float alpha = texel.a * mix(1.0, goldMask, isGold);
          if (alpha < 0.02) discard;

          gl_FragColor = vec4(col, alpha);
        }
      `
    });
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const s = animState.current;

    if (groupRef.current) {
      groupRef.current.scale.setScalar(s.hexScale);
      groupRef.current.position.y = s.hexY + Math.sin(t * 1.6) * 0.025;
      groupRef.current.rotation.y = s.hexRotY + state.pointer.x * 0.16;
      groupRef.current.rotation.x = s.hexRotX - state.pointer.y * 0.1;
    }

    if (sweepLightRef.current) {
      sweepLightRef.current.position.x = -3.2 + s.sweep * 6.4;
      sweepLightRef.current.position.y = 2.1 - s.sweep * 2.2;
      sweepLightRef.current.intensity = 5.5 + s.glow * 6.0;
    }

    if (rimMatRef.current) {
      rimMatRef.current.emissiveIntensity = 0.25 + s.glow * 1.35;
    }

    logoShaderMat.uniforms.uAssemble.value = s.assemble;
    logoShaderMat.uniforms.uSweep.value = s.sweep;
    logoShaderMat.uniforms.uGlow.value = s.glow;

    camera.position.z = s.camZ;
    camera.position.x = state.pointer.x * 0.18;
    camera.position.y = 0.18 + state.pointer.y * 0.12;
    camera.lookAt(0, 0.05, 0);
  });

  return React.createElement(
    React.Fragment,
    null,
    React.createElement("ambientLight", { intensity: 0.38, color: "#cbd5e1" }),
    React.createElement("directionalLight", { position: [3.5, 4.5, 4.5], intensity: 2.4, color: "#ffdf91" }),
    React.createElement("directionalLight", { position: [-4.0, -2.0, 2.5], intensity: 1.1, color: "#7d92ad" }),
    React.createElement("pointLight", { ref: sweepLightRef, position: [-2.5, 1.5, 2.6], intensity: 5.5, distance: 10, color: "#ffe18c" }),
    React.createElement(
      "group",
      { ref: groupRef, position: [0, 0.08, 0] },
      React.createElement(
        "mesh",
        { geometry: hexGeo },
        React.createElement("meshPhysicalMaterial", {
          color: "#111216",
          metalness: 0.88,
          roughness: 0.22,
          clearcoat: 0.9,
          clearcoatRoughness: 0.18,
          envMapIntensity: 1.6
        })
      ),
      React.createElement(
        "mesh",
        { geometry: goldRimGeo, position: [0, 0, 0.09] },
        React.createElement("meshStandardMaterial", {
          ref: rimMatRef,
          color: "#d4a237",
          metalness: 0.95,
          roughness: 0.2,
          emissive: "#b8821c",
          emissiveIntensity: 0.25
        })
      ),
      React.createElement(
        "mesh",
        { position: [0, 0, 0.178], material: logoShaderMat },
        React.createElement("planeGeometry", { args: [2.04, 2.27] })
      )
    )
  );
}

function PreloaderScene({ animState }) {
  return React.createElement(
    Canvas,
    {
      dpr: [1, 2],
      gl: { antialias: true, alpha: true, powerPreference: "high-performance" },
      camera: { position: [0, 0.2, 6.0], fov: 38 }
    },
    React.createElement(ConvergingParticles, { animState }),
    React.createElement(HexEmblem, { animState })
  );
}

function initR3FPreloader() {
  const preloader = document.getElementById("morzen-preloader");
  const canvasHost = document.getElementById("preloaderCanvasHost");
  const ringProgress = document.getElementById("preloaderRingProgress");
  const percentEl = document.getElementById("preloaderPercent");
  const statusEl = document.getElementById("preloaderStatus");
  const wordmarkWrap = document.getElementById("preloaderWordmarkWrap");
  const skipBtn = document.getElementById("preloaderSkip");

  if (!preloader || !canvasHost || !ringProgress || !percentEl) return;

  // Signal to classic fallback that R3F + GSAP has taken control
  window.__MORZEN_R3F_ACTIVE__ = true;

  const CIRC = 2 * Math.PI * 100; // r = 100 -> 628.3185
  const animState = {
    current: {
      converge: 0,
      hexScale: 0.42,
      hexY: -0.45,
      hexRotY: -0.95,
      hexRotX: 0.35,
      assemble: 0,
      sweep: -0.4,
      glow: 0,
      camZ: 6.2,
      progress: 0
    }
  };

  let root = null;
  try {
    root = createRoot(canvasHost);
    root.render(React.createElement(PreloaderScene, { animState }));
  } catch {
    window.__MORZEN_R3F_ACTIVE__ = false;
    return;
  }

  let finished = false;
  function finishPreloader() {
    if (finished) return;
    finished = true;
    preloader.classList.add("is-glowing");
    document.body.classList.remove("is-preloading");
    setTimeout(() => {
      preloader.classList.add("is-done");
      setTimeout(() => {
        if (root) root.unmount();
        preloader.remove();
      }, 900);
    }, 320);
  }

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tl = gsap.timeline({
    defaults: { ease: "power3.out" },
    onUpdate: () => {
      const p = Math.min(100, Math.round(animState.current.progress));
      percentEl.textContent = `${p}%`;
      ringProgress.style.strokeDashoffset = String(CIRC * (1 - p / 100));
    },
    onComplete: finishPreloader
  });

  if (prefersReduced) {
    animState.current.converge = 1;
    animState.current.hexScale = 1;
    animState.current.hexY = 0;
    animState.current.hexRotY = 0;
    animState.current.hexRotX = 0;
    animState.current.assemble = 1;
    animState.current.camZ = 4.35;
    wordmarkWrap?.classList.add("is-revealed");
    tl.to(animState.current, { progress: 100, duration: 0.45 });
  } else {
    tl.to(animState.current, { converge: 1, duration: 1.3, ease: "power2.inOut" }, 0)
      .to(
        animState.current,
        { hexScale: 1, hexY: 0, hexRotY: 0, hexRotX: 0, camZ: 4.35, duration: 1.45, ease: "power3.out" },
        0.15
      )
      .to(animState.current, { progress: 42, duration: 1.1, ease: "power1.inOut" }, 0)
      .call(() => {
        if (statusEl) statusEl.textContent = "ASSEMBLING METALLIC SEAL";
      }, null, 0.85)
      .to(animState.current, { assemble: 1, duration: 1.05, ease: "power2.out" }, 0.9)
      .to(animState.current, { sweep: 1.5, duration: 1.3, ease: "power2.inOut" }, 1.15)
      .to(animState.current, { progress: 84, duration: 1.25, ease: "power1.out" }, 1.1)
      .call(() => {
        if (statusEl) statusEl.textContent = "MORZEN INDUSTRIES";
        wordmarkWrap?.classList.add("is-revealed");
      }, null, 2.05)
      .to(animState.current, { progress: 100, glow: 1, duration: 0.75, ease: "power2.out" }, 2.25);
  }

  skipBtn?.addEventListener("click", () => {
    tl.kill();
    animState.current.progress = 100;
    percentEl.textContent = "100%";
    ringProgress.style.strokeDashoffset = "0";
    wordmarkWrap?.classList.add("is-revealed");
    finishPreloader();
  });
}

initR3FPreloader();
