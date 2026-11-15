export type PartKey =
  | 'upper'
  | 'midsole'
  | 'outsole'
  | 'laces'
  | 'tongue'
  | 'logo';

export interface ProjectedAnchor {
  xPct: number;
  yPct: number;
}

export interface SneakerScrollState {
  sectionIndex: number;
  globalProgress: number;
  heroDropOffsetY: number;
  showcaseRotationY: number;
  explodeProgress: number;
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scale: number;
  userDragYaw: number;
  userDragPitch: number;
  isDragging: boolean;
  projectedAnchors: Record<PartKey, ProjectedAnchor>;
}

/**
 * Shared 60fps mutable state mutated by GSAP ScrollTrigger & pointer drag handlers
 * and read directly inside `<Sneaker />`'s WebGL animation loop to avoid React re-render overhead.
 */
export const sneakerScrollState: SneakerScrollState = {
  sectionIndex: 0,
  globalProgress: 0,
  heroDropOffsetY: 0,
  showcaseRotationY: 0,
  explodeProgress: 0,
  positionX: 0,
  positionY: 0.05,
  positionZ: 0,
  rotationX: 0.14,
  rotationY: -0.45,
  rotationZ: 0.35, // 20 degrees tilt in Hero
  scale: 1.28,
  userDragYaw: 0,
  userDragPitch: 0,
  isDragging: false,
  projectedAnchors: {
    upper: { xPct: 50, yPct: 48 },
    midsole: { xPct: 50, yPct: 60 },
    outsole: { xPct: 50, yPct: 72 },
    laces: { xPct: 52, yPct: 36 },
    tongue: { xPct: 47, yPct: 32 },
    logo: { xPct: 54, yPct: 52 },
  },
};

export function resetSneakerScrollState() {
  sneakerScrollState.sectionIndex = 0;
  sneakerScrollState.globalProgress = 0;
  sneakerScrollState.heroDropOffsetY = 0;
  sneakerScrollState.showcaseRotationY = 0;
  sneakerScrollState.explodeProgress = 0;
  sneakerScrollState.positionX = 0;
  sneakerScrollState.positionY = 0.05;
  sneakerScrollState.positionZ = 0;
  sneakerScrollState.rotationX = 0.14;
  sneakerScrollState.rotationY = -0.45;
  sneakerScrollState.rotationZ = 0.35;
  sneakerScrollState.scale = 1.28;
  sneakerScrollState.userDragYaw = 0;
  sneakerScrollState.userDragPitch = 0;
  sneakerScrollState.isDragging = false;
}

