'use client';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export interface SneakerUpdateParams {
  primaryGlowHex: string;
  secondaryAccentHex: string;
  deconstructFactor?: number;
  autoFloat?: boolean;
}

export interface SneakerInstance {
  group: THREE.Group;
  update: (elapsed: number, delta: number, params: SneakerUpdateParams) => void;
  setGlbUrl: (url?: string) => void;
  dispose: () => void;
}

export interface SneakerCreateOptions {
  primaryGlowHex: string;
  secondaryAccentHex: string;
  glbModelUrl?: string;
  silhouetteVariant?: 'runner' | 'high' | 'sculpt' | 'zero';
}

const IMAGE_TEX_CACHE = new Map<string, Promise<THREE.Texture | null>>();

let sharedDracoLoader: DRACOLoader | null = null;
function getDracoLoader(): DRACOLoader {
  if (!sharedDracoLoader) {
    sharedDracoLoader = new DRACOLoader();
    sharedDracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
    );
  }
  return sharedDracoLoader;
}

export function isGlbModelUrl(url?: string): boolean {
  if (!url) return false;
  return /\.(glb|gltf)(\?|#|$)/i.test(url) || url.startsWith('blob:');
}

function resolveOriginalImageFromUrlOrVariant(
  rawUrl?: string,
  silhouetteVariant: 'runner' | 'high' | 'sculpt' | 'zero' = 'runner'
): string {
  const s = (rawUrl || '').toLowerCase();
  if (s.startsWith('/images/shoes/')) return rawUrl!;
  if (s.includes('espresso') || s.includes('mocha') || s.includes('heritage-mocha')) {
    return '/images/shoes/espresso-hightop.png';
  }
  if (s.includes('crimson') || s.includes('velocity')) {
    return '/images/shoes/crimson-runner.png';
  }
  if (s.includes('navy') || s.includes('crosby') || s.includes('suede')) {
    return '/images/shoes/navy-suede.png';
  }
  if (s.includes('oxford') || s.includes('camden') || s.includes('black')) {
    return '/images/shoes/black-oxford.png';
  }
  if (s.includes('chestnut') || s.includes('highland') || s.includes('walker')) {
    return '/images/shoes/chestnut-walker.png';
  }
  if (s.includes('ivory') || s.includes('mercer') || s.includes('canvas')) {
    return '/images/shoes/ivory-canvas.png';
  }
  if (s.includes('cobalt') || s.includes('tempo')) {
    return '/images/shoes/cobalt-trainer.png';
  }

  switch (silhouetteVariant) {
    case 'high':
      return '/images/shoes/espresso-hightop.png';
    case 'sculpt':
      return '/images/shoes/crimson-runner.png';
    case 'zero':
      return '/images/shoes/navy-suede.png';
    default:
      return '/images/shoes/cobalt-trainer.png';
  }
}

function loadCutoutTexture(url: string): Promise<THREE.Texture | null> {
  const cached = IMAGE_TEX_CACHE.get(url);
  if (cached) return cached;

  const p = new Promise<THREE.Texture | null>((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      url,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        resolve(tex);
      },
      undefined,
      () => resolve(null)
    );
  });
  IMAGE_TEX_CACHE.set(url, p);
  return p;
}

function clearAndDisposeGroup(group: THREE.Group) {
  group.traverse((child) => {
    const meshChild = child as THREE.Mesh;
    if (meshChild.isMesh) {
      meshChild.geometry?.dispose();
      const mats = Array.isArray(meshChild.material)
        ? meshChild.material
        : [meshChild.material];
      mats.forEach((m) => m?.dispose());
    }
  });
  group.clear();
}

export function normalizeGlbScene(scene: THREE.Object3D, targetSize = 2.35): THREE.Object3D {
  const model = scene.clone(true);
  model.traverse((child) => {
    const meshChild = child as THREE.Mesh;
    if (meshChild.isMesh) {
      meshChild.castShadow = true;
      meshChild.receiveShadow = true;
    }
  });

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxDim;
  model.scale.multiplyScalar(scale);

  box.setFromObject(model);
  box.getCenter(center);
  model.position.sub(center);

  return model;
}

/**
 * Studio viewer instance supporting both uploaded 3D Draco/standard `.glb` models
 * (via GLTFLoader + DRACOLoader) and clean high-res shoe cutout photography.
 */
export function createSneakerInstance(
  options: SneakerCreateOptions
): SneakerInstance {
  const root = new THREE.Group();
  const variant = options.silhouetteVariant || 'runner';

  const CARD_SIZE = 2.45;
  const geo = new THREE.PlaneGeometry(CARD_SIZE, CARD_SIZE);
  const mat = new THREE.MeshBasicMaterial({
    transparent: true,
    alphaTest: 0.03,
    side: THREE.DoubleSide,
    opacity: 1,
  });
  const mesh = new THREE.Mesh(geo, mat);
  root.add(mesh);

  const glbContainer = new THREE.Group();
  glbContainer.visible = false;
  root.add(glbContainer);

  let disposed = false;
  let loadSeq = 0;

  const applyFallbackTexture = (seq: number, rawUrl?: string) => {
    const resolved = resolveOriginalImageFromUrlOrVariant(rawUrl, variant);
    void loadCutoutTexture(resolved).then((tex) => {
      if (disposed || seq !== loadSeq || !tex) return;
      mat.map = tex;
      mat.needsUpdate = true;
      mesh.visible = true;
      glbContainer.visible = false;
    });
  };

  const loadForUrl = (rawUrl?: string) => {
    const seq = ++loadSeq;
    const trimmed = rawUrl?.trim();

    if (isGlbModelUrl(trimmed)) {
      mesh.visible = false;
      clearAndDisposeGroup(glbContainer);
      glbContainer.visible = false;

      const loader = new GLTFLoader();
      loader.setCrossOrigin('anonymous');
      loader.setDRACOLoader(getDracoLoader());
      loader.load(
        trimmed!,
        (gltf) => {
          if (disposed || seq !== loadSeq) return;
          clearAndDisposeGroup(glbContainer);
          const normalized = normalizeGlbScene(gltf.scene, 2.35);
          glbContainer.add(normalized);
          glbContainer.visible = true;
          mesh.visible = false;
        },
        undefined,
        () => {
          if (disposed || seq !== loadSeq) return;
          applyFallbackTexture(seq, rawUrl);
        }
      );
      return;
    }

    clearAndDisposeGroup(glbContainer);
    glbContainer.visible = false;
    mesh.visible = true;

    const directCandidate =
      trimmed &&
      (trimmed.startsWith('/') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('data:'))
        ? trimmed
        : resolveOriginalImageFromUrlOrVariant(trimmed, variant);

    void loadCutoutTexture(directCandidate).then((tex) => {
      if (disposed || seq !== loadSeq) return;
      if (tex) {
        mat.map = tex;
        mat.needsUpdate = true;
        return;
      }
      applyFallbackTexture(seq, rawUrl);
    });
  };

  loadForUrl(options.glbModelUrl);

  const setGlbUrl = (url?: string) => {
    loadForUrl(url);
  };

  const update = (
    elapsed: number,
    _delta: number,
    params: SneakerUpdateParams
  ) => {
    const factor = params.deconstructFactor ?? 0;
    const floatY = params.autoFloat ? Math.sin(elapsed * 1.4) * 0.03 : 0;
    root.position.y = floatY;
    root.scale.setScalar(1 + factor * 0.14);
  };

  const dispose = () => {
    disposed = true;
    clearAndDisposeGroup(glbContainer);
    geo.dispose();
    mat.dispose();
  };

  return { group: root, update, setGlbUrl, dispose };
}
