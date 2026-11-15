'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { BRAND_CONFIG } from '@/config/brand.config';
import {
  SHOWCASE_PRODUCTS,
  getColorwayForProduct,
  getShowcaseProductById,
} from '@/data/products';
import { useStore } from '@/context/StoreContext';
import { useSneakerStore } from '@/store/useSneakerStore';
import { PartKey, sneakerScrollState } from './sneakerScrollState';
import { isGlbModelUrl, normalizeGlbScene } from './ProceduralSneakerMesh';

function createWarmShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 10, 128, 128, 122);
    grad.addColorStop(0, 'rgba(28, 25, 23, 0.28)');
    grad.addColorStop(0.5, 'rgba(28, 25, 23, 0.11)');
    grad.addColorStop(1, 'rgba(28, 25, 23, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createSubtleAmbientPadTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 8, 128, 128, 120);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.08)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * Single `<Sneaker />` component presenting the user's real studio shoe photographs
 * cleanly on a responsive Three.js stage with soft studio floor shadow, smooth scroll
 * motion, interactive tilt/rotate inspection, and anatomical hotspot projection
 * without slicing or distorting the photograph.
 */
export function Sneaker() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  const selectedProductId = useSneakerStore((s) => s.selectedProductId);
  const hoveredProductId = useSneakerStore((s) => s.hoveredProductId);
  const selectedColorwayId = useSneakerStore((s) => s.selectedColorwayId);
  const setLoadProgress = useSneakerStore((s) => s.setLoadProgress);
  const setIsLoaded = useSneakerStore((s) => s.setIsLoaded);
  const { products: cmsProducts } = useStore();

  const activeProduct = getShowcaseProductById(
    hoveredProductId || selectedProductId
  );
  const activeColorway = hoveredProductId
    ? activeProduct.colorways[0]
    : getColorwayForProduct(activeProduct, selectedColorwayId);

  const liveAssetUrl = useMemo(() => {
    const matchedProd =
      cmsProducts.find(
        (p) => p.slug === activeProduct.slug || p.id === activeProduct.id
      ) || cmsProducts[0];
    const matchedVar =
      matchedProd?.variants?.find((v) =>
        v.colorName.toLowerCase().includes(activeColorway.name.toLowerCase())
      ) || matchedProd?.variants?.[0];
    return (
      matchedVar?.glbModelUrl ||
      matchedVar?.posterImageUrl ||
      activeColorway.imageUrl ||
      activeProduct.imageUrl
    );
  }, [cmsProducts, activeProduct.slug, activeProduct.id, activeProduct.imageUrl, activeColorway.name, activeColorway.imageUrl]);

  const activeImageUrl = liveAssetUrl;

  const targetImageUrlRef = useRef<string>(activeImageUrl);
  const targetAccentRef = useRef<THREE.Color>(
    new THREE.Color(activeColorway.accentHex)
  );

  useEffect(() => {
    targetImageUrlRef.current = activeImageUrl;
    targetAccentRef.current = new THREE.Color(activeColorway.accentHex);
  }, [activeImageUrl, activeColorway.accentHex]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile =
      typeof window !== 'undefined' && window.innerWidth < 768;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglFailed(true);
      setIsLoaded(true);
      return;
    }

    const dprCap = isMobile ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    // Warm studio PBR lighting so uploaded 3D .glb sneakers render crisply
    const ambientLight = new THREE.AmbientLight('#ffffff', 1.15);
    const hemiLight = new THREE.HemisphereLight('#fffbf2', '#3b332b', 1.1);
    const keyLight = new THREE.DirectionalLight('#ffffff', 2.2);
    keyLight.position.set(3.5, 5.5, 4.5);
    const rimLight = new THREE.DirectionalLight('#fff4e0', 1.0);
    rimLight.position.set(-4.0, 2.5, -3.5);
    scene.add(ambientLight, hemiLight, keyLight, rimLight);

    const camera = new THREE.PerspectiveCamera(
      isMobile ? 44 : 36,
      window.innerWidth / window.innerHeight,
      0.1,
      50
    );
    camera.position.set(0, 0.2, isMobile ? 6.0 : 5.0);
    camera.lookAt(0, 0, 0);

    const rootPivot = new THREE.Group();
    scene.add(rootPivot);

    const shadowTex = createWarmShadowTexture();
    const padTex = createSubtleAmbientPadTexture();

    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.7),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.72,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, -1.06, 0);
    scene.add(contactShadow);

    const floorTintMat = new THREE.MeshBasicMaterial({
      map: padTex,
      color: new THREE.Color(BRAND_CONFIG.palette.accent),
      transparent: true,
      depthWrite: false,
      opacity: 0.25,
    });
    const floorTint = new THREE.Mesh(
      new THREE.PlaneGeometry(3.8, 2.2),
      floorTintMat
    );
    floorTint.rotation.x = -Math.PI / 2;
    floorTint.position.set(0, -1.07, 0);
    scene.add(floorTint);

    // Preload all unique uploaded shoe cutouts cleanly
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    const maxAnisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
    const textureCache = new Map<string, THREE.Texture>();
    const pendingTexUrls = new Set<string>();

    const allUrls = Array.from(
      new Set(
        SHOWCASE_PRODUCTS.flatMap((p) => [
          p.imageUrl,
          ...p.colorways.map((c) => c.imageUrl),
        ]).filter(Boolean)
      )
    );

    let loadedCount = 0;
    const totalCount = Math.max(1, allUrls.length);
    setLoadProgress(20);

    const safetyTimer = window.setTimeout(() => {
      setIsLoaded(true);
    }, 2200);

    const loadTex = (url: string): Promise<THREE.Texture | null> =>
      new Promise((resolve) => {
        if (textureCache.has(url)) {
          resolve(textureCache.get(url)!);
          return;
        }
        if (pendingTexUrls.has(url)) {
          resolve(null);
          return;
        }
        pendingTexUrls.add(url);
        textureLoader.load(
          url,
          (tex) => {
            pendingTexUrls.delete(url);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = maxAnisotropy;
            tex.needsUpdate = true;
            textureCache.set(url, tex);
            loadedCount += 1;
            setLoadProgress(Math.round((loadedCount / totalCount) * 100));
            if (loadedCount >= 1) {
              window.clearTimeout(safetyTimer);
              setIsLoaded(true);
            }
            resolve(tex);
          },
          undefined,
          () => {
            pendingTexUrls.delete(url);
            loadedCount += 1;
            setLoadProgress(Math.round((loadedCount / totalCount) * 100));
            resolve(null);
          }
        );
      });

    allUrls.forEach((u) => {
      void loadTex(u);
    });

    // Single crisp studio plane (zero multi-layer ghosting or cropped rectangles)
    const SHOE_CARD_SIZE = 2.65;
    const shoeMat = new THREE.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.03,
      side: THREE.DoubleSide,
      opacity: 1,
    });
    const shoePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(SHOE_CARD_SIZE, SHOE_CARD_SIZE),
      shoeMat
    );
    rootPivot.add(shoePlane);

    // 3D GLB/GLTF Group on the same pivot for real 3D assets uploaded in Admin
    const glbGroup = new THREE.Group();
    glbGroup.visible = false;
    rootPivot.add(glbGroup);

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
    );
    const gltfLoader = new GLTFLoader();
    gltfLoader.setCrossOrigin('anonymous');
    gltfLoader.setDRACOLoader(dracoLoader);

    // Precompute local anchor offsets directly on the intact shoe plane
    const localAnchors: Record<PartKey, THREE.Vector3> = {} as never;
    for (const cfg of BRAND_CONFIG.anatomyParts) {
      const cx =
        ((cfg.uvRegion.xMin + cfg.uvRegion.xMax) * 0.5 - 0.5) * SHOE_CARD_SIZE;
      const cy =
        ((cfg.uvRegion.yMin + cfg.uvRegion.yMax) * 0.5 - 0.5) * SHOE_CARD_SIZE;
      localAnchors[cfg.meshName] = new THREE.Vector3(cx, cy, 0.02);
    }

    let appliedUrl = '';
    let glbRequestSeq = 0;

    const clearGlbGroup = () => {
      glbGroup.traverse((child) => {
        const meshChild = child as THREE.Mesh;
        if (meshChild.isMesh) {
          meshChild.geometry?.dispose();
          const mats = Array.isArray(meshChild.material)
            ? meshChild.material
            : [meshChild.material];
          mats.forEach((m) => m?.dispose());
        }
      });
      glbGroup.clear();
    };

    const applyAssetIfReady = (url: string) => {
      if (!url || appliedUrl === url) {
        if (!isGlbModelUrl(url)) {
          const tex = textureCache.get(url);
          if (tex && shoeMat.map !== tex) {
            shoeMat.map = tex;
            shoeMat.needsUpdate = true;
          }
        }
        return;
      }

      if (isGlbModelUrl(url)) {
        appliedUrl = url;
        const seq = ++glbRequestSeq;
        gltfLoader.load(
          url,
          (gltf) => {
            if (seq !== glbRequestSeq) return;
            clearGlbGroup();
            glbGroup.add(normalizeGlbScene(gltf.scene, 2.5));
            glbGroup.visible = true;
            shoePlane.visible = false;
            window.clearTimeout(safetyTimer);
            setIsLoaded(true);
          },
          undefined,
          () => {
            if (seq !== glbRequestSeq) return;
            glbGroup.visible = false;
            shoePlane.visible = true;
          }
        );
        return;
      }

      glbRequestSeq += 1;
      clearGlbGroup();
      glbGroup.visible = false;
      shoePlane.visible = true;

      const tex = textureCache.get(url);
      if (tex) {
        appliedUrl = url;
        shoeMat.map = tex;
        shoeMat.needsUpdate = true;
      } else {
        void loadTex(url).then((loadedTex) => {
          if (loadedTex && targetImageUrlRef.current === url) {
            appliedUrl = url;
            shoeMat.map = loadedTex;
            shoeMat.needsUpdate = true;
          }
        });
      }
    };

    const handleResize = () => {
      if (!renderer) return;
      const mobileNow = window.innerWidth < 768;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.fov = mobileNow ? 44 : 36;
      camera.position.z = mobileNow ? 6.0 : 5.0;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(
        Math.min(window.devicePixelRatio || 1, mobileNow ? 1.5 : 2)
      );
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    const tempVec = new THREE.Vector3();
    let rafId = 0;

    const animate = () => {
      rafId = window.requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      applyAssetIfReady(targetImageUrlRef.current);

      const exp = prefersReducedMotion ? 0 : sneakerScrollState.explodeProgress;
      const idleAmplitude =
        prefersReducedMotion || exp > 0.08
          ? 0
          : Math.sin(elapsed * 1.25) * 0.032;

      rootPivot.position.set(
        sneakerScrollState.positionX,
        sneakerScrollState.positionY +
          sneakerScrollState.heroDropOffsetY +
          idleAmplitude,
        sneakerScrollState.positionZ
      );

      // Gentle 3D tilt/turn while keeping the shoe clear and natural
      rootPivot.rotation.set(
        sneakerScrollState.rotationX * 0.4 + sneakerScrollState.userDragPitch,
        sneakerScrollState.rotationY * 0.3 +
          sneakerScrollState.showcaseRotationY +
          sneakerScrollState.userDragYaw,
        sneakerScrollState.rotationZ * 0.32
      );

      // Smooth subtle zoom during Section 3 materials breakdown instead of slicing photo
      const scaleResponsive = isMobile ? 0.84 : 1.04;
      const inspectZoom = 1 + exp * 0.14;
      rootPivot.scale.setScalar(
        sneakerScrollState.scale * scaleResponsive * inspectZoom
      );

      const shadowScale = Math.max(
        0.72,
        sneakerScrollState.scale * 0.84 * scaleResponsive
      );
      contactShadow.position.x = sneakerScrollState.positionX;
      contactShadow.scale.setScalar(shadowScale);
      contactShadow.material.opacity = Math.max(0.35, 0.72 - exp * 0.18);
      floorTint.position.x = sneakerScrollState.positionX;
      floorTint.scale.setScalar(shadowScale);
      floorTintMat.color.lerp(targetAccentRef.current, 0.08);

      rootPivot.updateMatrixWorld();
      if (exp > 0.02) {
        for (const cfg of BRAND_CONFIG.anatomyParts) {
          const anchor = localAnchors[cfg.meshName];
          if (!anchor) continue;
          tempVec.copy(anchor);
          rootPivot.localToWorld(tempVec);
          tempVec.project(camera);
          sneakerScrollState.projectedAnchors[cfg.meshName] = {
            xPct: Math.min(86, Math.max(14, (tempVec.x * 0.5 + 0.5) * 100)),
            yPct: Math.min(86, Math.max(14, (-tempVec.y * 0.5 + 0.5) * 100)),
          };
        }
      }

      if (!sneakerScrollState.isDragging) {
        sneakerScrollState.userDragPitch *= 0.94;
      }

      renderer?.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      window.clearTimeout(safetyTimer);
      shadowTex.dispose();
      padTex.dispose();
      textureCache.forEach((t) => t.dispose());
      clearGlbGroup();
      dracoLoader.dispose();
      shoeMat.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [setIsLoaded, setLoadProgress]);

  if (webglFailed) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-10"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImageUrl}
          alt={activeProduct.name}
          className="max-h-[65vh] w-auto object-contain drop-shadow-[0_24px_38px_rgba(24,24,27,0.22)]"
        />
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      aria-label={`Studio view displaying ${activeProduct.name}`}
      className="pointer-events-none fixed inset-0 z-10"
    />
  );
}
