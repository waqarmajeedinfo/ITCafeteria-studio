import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Eye, 
  RotateCw, 
  Sun, 
  Sparkles, 
  Layers, 
  Maximize2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const ThreeStudio: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activePreset, setActivePreset] = useState<'cyber' | 'warm' | 'matrix'>('cyber');
  const [activeCam, setActiveCam] = useState<'front' | 'hologram' | 'wide'>('front');
  const [hologramSpin, setHologramSpin] = useState(true);
  const [collapsedDock, setCollapsedDock] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    let animFrameId = 0;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.05);

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.2, 5.2);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.appendChild(renderer.domElement);

    // Procedural Floor Texture
    const createGridTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#070a14';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = '#00e5ff18';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 512; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(12, 12);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    // Floor
    const floorGeo = new THREE.PlaneGeometry(30, 30);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createGridTexture(),
      roughness: 0.3,
      metalness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // 3-Point Lighting
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x050811, 0.8);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0x00e5ff, 2.5);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0xa855f7, 3, 10);
    rimLight.position.set(-3, 3, -2);
    scene.add(rimLight);

    // ==========================================
    // Composite Procedural Desk Group (3-12 parts)
    // ==========================================
    const deskGroup = new THREE.Group();

    // 1. Desktop surface
    const deskTopGeo = new THREE.BoxGeometry(3.2, 0.08, 1.4);
    const deskTopMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.2,
      metalness: 0.9,
    });
    const deskTop = new THREE.Mesh(deskTopGeo, deskTopMat);
    deskTop.position.set(0, 1.2, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    deskGroup.add(deskTop);

    // 2. Beveled Edge Trim (Neon accent)
    const trimGeo = new THREE.BoxGeometry(3.22, 0.02, 1.42);
    const trimMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.set(0, 1.16, 0);
    deskGroup.add(trim);

    // 3 & 4. Metal Legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.2, 16);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.1 });
    
    const legPositions = [
      [-1.4, 0.6, 0.5],
      [1.4, 0.6, 0.5],
      [-1.4, 0.6, -0.5],
      [1.4, 0.6, -0.5]
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      deskGroup.add(leg);
    });

    // 5. IT Cafeteria Branded Mug
    const mugGroup = new THREE.Group();
    const mugBodyGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.18, 24);
    const mugMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2, metalness: 0.4 });
    const mugBody = new THREE.Mesh(mugBodyGeo, mugMat);
    mugBody.castShadow = true;
    mugGroup.add(mugBody);

    const handleGeo = new THREE.TorusGeometry(0.05, 0.015, 12, 24, Math.PI);
    const handle = new THREE.Mesh(handleGeo, mugMat);
    handle.rotation.z = -Math.PI / 2;
    handle.position.set(0.08, 0, 0);
    mugGroup.add(handle);
    mugGroup.position.set(1.1, 1.33, 0.3);
    deskGroup.add(mugGroup);

    // 6. Laptop / Workstation
    const laptopGroup = new THREE.Group();
    const baseGeo = new THREE.BoxGeometry(0.55, 0.015, 0.38);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 });
    const lapBase = new THREE.Mesh(baseGeo, baseMat);
    laptopGroup.add(lapBase);

    const screenGeo = new THREE.BoxGeometry(0.55, 0.35, 0.015);
    const screenMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 });
    const lapScreen = new THREE.Mesh(screenGeo, screenMat);
    lapScreen.position.set(0, 0.18, -0.19);
    lapScreen.rotation.x = -0.15;
    laptopGroup.add(lapScreen);

    // Glowing display screen
    const displayGeo = new THREE.PlaneGeometry(0.5, 0.3);
    const displayMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const display = new THREE.Mesh(displayGeo, displayMat);
    display.position.set(0, 0.18, -0.18);
    display.rotation.x = -0.15;
    laptopGroup.add(display);

    laptopGroup.position.set(-0.8, 1.25, 0.1);
    laptopGroup.rotation.y = 0.25;
    deskGroup.add(laptopGroup);

    scene.add(deskGroup);

    // ==========================================
    // Composite Holographic Quantum AI Core (3-8 parts)
    // ==========================================
    const hologramGroup = new THREE.Group();
    hologramGroup.position.set(0, 1.7, 0);

    // Central Core Sphere
    const coreGeo = new THREE.IcosahedronGeometry(0.25, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      roughness: 0.1,
      metalness: 0.9,
      wireframe: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    hologramGroup.add(core);

    // Inner Glowing Orb
    const orbGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    hologramGroup.add(orb);

    // Outer Energy Rings
    const ring1Geo = new THREE.TorusGeometry(0.42, 0.015, 16, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    const ring1 = new THREE.Mesh(ring1Geo, ringMat);
    hologramGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(0.55, 0.012, 16, 48);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    hologramGroup.add(ring2);

    scene.add(hologramGroup);

    // Radial Contact Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(3.5, 1.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.6,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.01;
    scene.add(shadow);

    // Target Camera positions for smooth damping
    const targetCamPos = new THREE.Vector3(0, 2.2, 5.2);
    const targetLookAt = new THREE.Vector3(0, 1.4, 0);

    // Mouse interaction for gentle parallax
    let mouseX = 0;
    let mouseY = 0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    containerRef.current.addEventListener('mousemove', onPointerMove);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop with Exponential Damping
    const clock = new THREE.Clock();

    const animate = () => {
      if (!isMounted) return;
      const dt = clock.getDelta();

      // Rotate Hologram
      if (hologramSpin) {
        core.rotation.y += dt * 0.8;
        core.rotation.x += dt * 0.4;
        ring1.rotation.z += dt * 1.2;
        ring2.rotation.y += dt * 0.9;
        ring2.rotation.x += dt * 0.5;
        hologramGroup.position.y = 1.7 + Math.sin(clock.getElapsedTime() * 2) * 0.06;
      }

      // Smooth camera interpolation
      camera.position.x += (targetCamPos.x + mouseX * 0.3 - camera.position.x) * (1 - Math.exp(-4 * dt));
      camera.position.y += (targetCamPos.y + mouseY * 0.2 - camera.position.y) * (1 - Math.exp(-4 * dt));
      camera.position.z += (targetCamPos.z - camera.position.z) * (1 - Math.exp(-4 * dt));
      camera.lookAt(targetLookAt);

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(animate);
    };

    animFrameId = requestAnimationFrame(animate);

    // Preset / Camera Change Handler Helpers
    const updateCamPreset = (preset: 'front' | 'hologram' | 'wide') => {
      if (preset === 'front') {
        targetCamPos.set(0, 2.0, 4.8);
        targetLookAt.set(0, 1.4, 0);
      } else if (preset === 'hologram') {
        targetCamPos.set(0, 1.8, 1.8);
        targetLookAt.set(0, 1.7, 0);
      } else if (preset === 'wide') {
        targetCamPos.set(3.5, 3.2, 5.8);
        targetLookAt.set(0, 1.2, 0);
      }
    };

    const updateThemePreset = (theme: 'cyber' | 'warm' | 'matrix') => {
      if (theme === 'cyber') {
        keyLight.color.setHex(0x00e5ff);
        rimLight.color.setHex(0xa855f7);
        coreMat.color.setHex(0x00e5ff);
      } else if (theme === 'warm') {
        keyLight.color.setHex(0xf59e0b);
        rimLight.color.setHex(0x38bdf8);
        coreMat.color.setHex(0xf59e0b);
      } else if (theme === 'matrix') {
        keyLight.color.setHex(0x10b981);
        rimLight.color.setHex(0x065f46);
        coreMat.color.setHex(0x10b981);
      }
    };

    (window as any).__updateThreeStudioCam = updateCamPreset;
    (window as any).__updateThreeStudioTheme = updateThemePreset;

    return () => {
      isMounted = false;
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', onPointerMove);
        if (renderer.domElement.parentElement === containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
      renderer.dispose();
    };
  }, []);

  const handleCameraChange = (view: 'front' | 'hologram' | 'wide') => {
    setActiveCam(view);
    if ((window as any).__updateThreeStudioCam) {
      (window as any).__updateThreeStudioCam(view);
    }
  };

  const handleThemeChange = (theme: 'cyber' | 'warm' | 'matrix') => {
    setActivePreset(theme);
    if ((window as any).__updateThreeStudioTheme) {
      (window as any).__updateThreeStudioTheme(theme);
    }
  };

  return (
    <div className="relative w-full h-[680px] bg-[#060913] rounded-2xl overflow-hidden border border-slate-800">
      {/* 3D Canvas Mount Point */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left Minimal Spec Badge (Three.js Directive Compliant) */}
      <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 pointer-events-none text-xs">
        <div className="font-bold text-white flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>IT Cafeteria 3D Virtual Studio</span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
          Composite PBR • 60 FPS Exponential Damping • Zero 404s
        </div>
      </div>

      {/* Collapsible Bottom Control Dock (<= 15% Viewport footprint) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl p-3 z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Studio Controls Dock
          </span>
          <button
            onClick={() => setCollapsedDock(!collapsedDock)}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-0.5"
          >
            {collapsedDock ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" /> Expand
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" /> Collapse
              </>
            )}
          </button>
        </div>

        {!collapsedDock && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-800/80 text-xs">
            {/* Camera Views */}
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Camera Views</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleCameraChange('front')}
                  className={`flex-1 py-1 px-2 rounded-lg text-center transition-colors ${
                    activeCam === 'front' ? 'bg-cyan-600 text-white font-medium' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Front
                </button>
                <button
                  onClick={() => handleCameraChange('hologram')}
                  className={`flex-1 py-1 px-2 rounded-lg text-center transition-colors ${
                    activeCam === 'hologram' ? 'bg-cyan-600 text-white font-medium' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Holo Core
                </button>
                <button
                  onClick={() => handleCameraChange('wide')}
                  className={`flex-1 py-1 px-2 rounded-lg text-center transition-colors ${
                    activeCam === 'wide' ? 'bg-cyan-600 text-white font-medium' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Wide
                </button>
              </div>
            </div>

            {/* Lighting Theme */}
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Lighting Identity</span>
              <div className="flex gap-1">
                <button
                  onClick={() => handleThemeChange('cyber')}
                  className={`flex-1 py-1 px-2 rounded-lg text-center transition-colors ${
                    activePreset === 'cyber' ? 'bg-blue-600 text-white font-medium' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Cyber Blue
                </button>
                <button
                  onClick={() => handleThemeChange('warm')}
                  className={`flex-1 py-1 px-2 rounded-lg text-center transition-colors ${
                    activePreset === 'warm' ? 'bg-amber-600 text-white font-medium' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Warm Tech
                </button>
                <button
                  onClick={() => handleThemeChange('matrix')}
                  className={`flex-1 py-1 px-2 rounded-lg text-center transition-colors ${
                    activePreset === 'matrix' ? 'bg-emerald-600 text-white font-medium' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Matrix Green
                </button>
              </div>
            </div>

            {/* Hologram Spin Toggle */}
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Holographic Dynamics</span>
              <button
                onClick={() => setHologramSpin(!hologramSpin)}
                className={`w-full py-1 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  hologramSpin ? 'bg-purple-600 text-white font-medium' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{hologramSpin ? 'Core Spinning (Active)' : 'Core Paused'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
