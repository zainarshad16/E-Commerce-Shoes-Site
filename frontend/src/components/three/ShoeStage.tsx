'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ScrollHotspot, Vector3Coords } from '@/types/cms';
import {
  createSneakerInstance,
  SneakerInstance,
} from './ProceduralSneakerMesh';

export interface CarouselShoeItem {
  id: string;
  name: string;
  primaryGlowHex: string;
  secondaryAccentHex: string;
  glbModelUrl?: string;
  silhouetteVariant?: 'runner' | 'high' | 'sculpt' | 'zero';
}

export interface ShoeStageProps {
  mode: 'hero-carousel' | 'scrollytelling' | 'admin-studio' | 'product-viewer';
  primaryGlowHex: string;
  secondaryAccentHex: string;
  glbModelUrl?: string;
  silhouetteVariant?: 'runner' | 'high' | 'sculpt' | 'zero';
  carouselItems?: CarouselShoeItem[];
  activeCarouselIndex?: number;
  scrollIndex?: number;
  carouselReveal?: number; // 0 = Hero Banner Centerpiece, 1 = Full Single-Row Lamp Carousel
  inspectedIndex?: number | null;
  inspectScrollProgress?: number; // 0 to 1 when inspecting a clicked 3D shoe
  onSelectCarouselIndex?: (idx: number) => void;
  onInspectCarouselIndex?: (idx: number) => void;
  hotspots?: ScrollHotspot[];
  scrollProgress?: number; // 0 to 1
  deconstructFactor?: number; // 0 to 1
  previewCamera?: { position: Vector3Coords; target: Vector3Coords } | null;
  onCameraTelemetry?: (position: Vector3Coords, target: Vector3Coords) => void;
}

export default function ShoeStage(props: ShoeStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef<ShoeStageProps>(props);
  propsRef.current = props;

  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const singleSneakerRef = useRef<SneakerInstance | null>(null);
  const carouselGroupRef = useRef<THREE.Group | null>(null);
  const carouselSneakersRef = useRef<SneakerInstance[]>([]);

  const carouselIdentityKey = (props.carouselItems || [])
    .map((item) => `${item.id}:${item.silhouetteVariant || 'runner'}`)
    .join('|');

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const initialCameraPos: [number, number, number] =
      propsRef.current.mode === 'hero-carousel'
        ? [0, 0.32, 5.45]
        : [2.75, 1.05, 3.15];

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 60);
    camera.position.set(...initialCameraPos);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Lighting Rig (Overhead Lamp + Moody Single-Row Contrast)
    const isCarousel = propsRef.current.mode === 'hero-carousel';
    const ambientLight = new THREE.AmbientLight('#ffffff', isCarousel ? 0.24 : 0.65);
    const hemiLight = new THREE.HemisphereLight('#f4f4f5', '#09090b', isCarousel ? 0.36 : 0.95);
    const keySpot = new THREE.SpotLight('#ffffff', isCarousel ? 26 : 44, 26, 0.48, 0.85, 1.4);
    keySpot.position.set(4, 7.5, 5.5);
    keySpot.castShadow = true;
    keySpot.shadow.mapSize.set(1024, 1024);

    // Overhead Center Studio Lamp Spotlight (illuminates whichever shoe scrolls under the lamp)
    const overheadSpot = new THREE.SpotLight(
      '#fffaf0',
      isCarousel ? 110 : 0,
      14,
      0.38,
      0.82,
      1.15
    );
    overheadSpot.position.set(0, 1.84, 0.3);
    overheadSpot.target.position.set(0, -0.55, 0.3);
    overheadSpot.castShadow = true;
    overheadSpot.shadow.mapSize.set(1024, 1024);

    const rimLight = new THREE.PointLight(
      propsRef.current.primaryGlowHex || '#CCFF00',
      28,
      16,
      1.5
    );
    rimLight.position.set(-3.4, 2.3, -2.8);

    const fillLight = new THREE.PointLight(
      propsRef.current.secondaryAccentHex || '#10B981',
      20,
      14,
      1.5
    );
    fillLight.position.set(3.4, -0.35, 2.8);

    const underGlow = new THREE.PointLight(
      propsRef.current.primaryGlowHex || '#CCFF00',
      isCarousel ? 18 : 12,
      8,
      1.7
    );
    underGlow.position.set(0, -1.05, 0.4);

    const topFill = new THREE.DirectionalLight('#ffffff', isCarousel ? 0.32 : 1.35);
    topFill.position.set(-2, 4.5, 3);

    scene.add(
      ambientLight,
      hemiLight,
      keySpot,
      overheadSpot,
      overheadSpot.target,
      rimLight,
      fillLight,
      underGlow,
      topFill
    );

    // Physical Overhead Studio Lamp Fixture + Volumetric Light Cone (Hero Carousel)
    const lampGroup = new THREE.Group();
    const lampHousingGeo = new THREE.BoxGeometry(1.72, 0.085, 0.34);
    const lampHousingMat = new THREE.MeshStandardMaterial({
      color: '#141418',
      metalness: 0.85,
      roughness: 0.25,
    });
    const lampHousing = new THREE.Mesh(lampHousingGeo, lampHousingMat);
    lampHousing.position.set(0, 1.9, 0.3);

    const lampBarGeo = new THREE.BoxGeometry(1.48, 0.024, 0.18);
    const lampBarMat = new THREE.MeshBasicMaterial({
      color: '#fff6e0',
    });
    const lampBar = new THREE.Mesh(lampBarGeo, lampBarMat);
    lampBar.position.set(0, 1.855, 0.3);

    const rodGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.6, 8);
    const leftRod = new THREE.Mesh(rodGeo, lampHousingMat);
    leftRod.position.set(-0.66, 2.7, 0.3);
    const rightRod = new THREE.Mesh(rodGeo, lampHousingMat);
    rightRod.position.set(0.66, 2.7, 0.3);

    const beamGeo = new THREE.CylinderGeometry(0.55, 1.95, 2.72, 40, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: '#fff8e7',
      transparent: true,
      opacity: 0.065,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(0, 0.49, 0.3);

    const innerBeamGeo = new THREE.CylinderGeometry(0.32, 1.2, 2.66, 32, 1, true);
    const innerBeamMat = new THREE.MeshBasicMaterial({
      color: propsRef.current.primaryGlowHex || '#CCFF00',
      transparent: true,
      opacity: 0.055,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const innerBeamMesh = new THREE.Mesh(innerBeamGeo, innerBeamMat);
    innerBeamMesh.position.set(0, 0.51, 0.3);

    lampGroup.add(lampHousing, lampBar, leftRod, rightRod, beamMesh, innerBeamMesh);
    lampGroup.visible = isCarousel;
    scene.add(lampGroup);

    // Dual-Ring Studio Pedestal + Radial Crosshairs
    const pedestalGroup = new THREE.Group();
    pedestalGroup.position.set(0, -0.78, propsRef.current.mode === 'hero-carousel' ? 0.35 : 0);

    const innerRingGeo = new THREE.RingGeometry(1.06, 1.11, 72);
    const innerRingMat = new THREE.MeshBasicMaterial({
      color: propsRef.current.primaryGlowHex || '#CCFF00',
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRing.rotation.x = -Math.PI / 2;

    const outerRingGeo = new THREE.RingGeometry(1.42, 1.45, 72);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: propsRef.current.secondaryAccentHex || '#10B981',
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
    });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;

    const crosshairMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
    });
    const crosshairGeos: THREE.PlaneGeometry[] = [];
    for (const angle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
      const tickGeo = new THREE.PlaneGeometry(0.18, 0.015);
      crosshairGeos.push(tickGeo);
      const tick = new THREE.Mesh(tickGeo, crosshairMat);
      tick.rotation.x = -Math.PI / 2;
      tick.rotation.z = angle;
      tick.position.set(Math.cos(angle) * 1.26, 0.002, Math.sin(angle) * 1.26);
      pedestalGroup.add(tick);
    }

    pedestalGroup.add(innerRing, outerRing);
    scene.add(pedestalGroup);

    const shadowPlaneGeo = new THREE.CircleGeometry(3.8, 48);
    const shadowPlaneMat = new THREE.ShadowMaterial({ opacity: 0.48 });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.position.set(0, -0.8, 0);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Controls (Enabled outside scrollytelling mode)
    let controls: OrbitControls | null = null;
    if (propsRef.current.mode !== 'scrollytelling') {
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.07;

      if (propsRef.current.mode === 'hero-carousel') {
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.minPolarAngle = Math.PI * 0.34;
        controls.maxPolarAngle = Math.PI * 0.56;
      } else {
        controls.minDistance = 1.8;
        controls.maxDistance = 6.5;
        controls.maxPolarAngle = Math.PI * 0.62;
      }

      controls.addEventListener('change', () => {
        const cb = propsRef.current.onCameraTelemetry;
        if (!cb || !controls) return;
        cb(
          {
            x: Number(camera.position.x.toFixed(2)),
            y: Number(camera.position.y.toFixed(2)),
            z: Number(camera.position.z.toFixed(2)),
          },
          {
            x: Number(controls.target.x.toFixed(2)),
            y: Number(controls.target.y.toFixed(2)),
            z: Number(controls.target.z.toFixed(2)),
          }
        );
      });
      controlsRef.current = controls;
    }

    // Populate Scene Graph (Carousel vs Single/Scrollytelling Shoe)
    const carouselContainer = new THREE.Group();
    carouselGroupRef.current = carouselContainer;
    const singleSpinWrapper = new THREE.Group();

    const items = propsRef.current.carouselItems || [];
    const createdCarouselShoes: SneakerInstance[] = [];

    if (propsRef.current.mode === 'hero-carousel' && items.length > 0) {
      items.forEach((item, idx) => {
        const shoe = createSneakerInstance({
          primaryGlowHex: item.primaryGlowHex,
          secondaryAccentHex: item.secondaryAccentHex,
          glbModelUrl: item.glbModelUrl,
          silhouetteVariant: item.silhouetteVariant,
        });
        shoe.group.userData.carouselIndex = idx;
        createdCarouselShoes.push(shoe);
        carouselContainer.add(shoe.group);
      });
      carouselSneakersRef.current = createdCarouselShoes;
      scene.add(carouselContainer);
    } else {
      const shoe = createSneakerInstance({
        primaryGlowHex: propsRef.current.primaryGlowHex,
        secondaryAccentHex: propsRef.current.secondaryAccentHex,
        glbModelUrl: propsRef.current.glbModelUrl,
        silhouetteVariant: propsRef.current.silhouetteVariant,
      });
      singleSneakerRef.current = shoe;
      singleSpinWrapper.add(shoe.group);
      scene.add(singleSpinWrapper);
    }

    // Pointer move parallax + click raycasting for Hero Carousel flanking silhouettes
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currentParallaxX = 0;
    let currentParallaxY = 0;

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      targetParallaxX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetParallaxY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerLeave = () => {
      targetParallaxX = 0;
      targetParallaxY = 0;
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = (e: PointerEvent) => {
      if (propsRef.current.mode !== 'hero-carousel') return;
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      if (Math.hypot(dx, dy) > 8) return; // Dragging orbit, not clicking

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);

      const hits = raycaster.intersectObjects(carouselContainer.children, true);
      if (hits.length > 0) {
        let obj: THREE.Object3D | null = hits[0].object;
        while (obj && obj.userData.carouselIndex === undefined) {
          obj = obj.parent;
        }
        if (obj && typeof obj.userData.carouselIndex === 'number') {
          propsRef.current.onSelectCarouselIndex?.(obj.userData.carouselIndex);
          propsRef.current.onInspectCarouselIndex?.(obj.userData.carouselIndex);
        }
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    // ResizeObserver for crisp responsive viewport
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(1, entry.contentRect.width);
      const h = Math.max(1, entry.contentRect.height);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Animation Loop
    const clock = new THREE.Clock();
    const targetPrimaryColor = new THREE.Color();
    const targetSecondaryColor = new THREE.Color();
    const desiredCamPos = new THREE.Vector3(2.8, 1.1, 3.2);
    const desiredCamTarget = new THREE.Vector3(0, 0, 0);
    const currentCamTarget = new THREE.Vector3(0, 0, 0);

    let rafId = 0;
    let smoothedScrollPos = propsRef.current.scrollIndex ?? propsRef.current.activeCarouselIndex ?? 0;
    let smoothedReveal = propsRef.current.carouselReveal ?? 1;
    let wasInspecting = false;
    let exitCameraResetTimer = 0;

    const animate = () => {
      rafId = requestAnimationFrame(animate);
      const delta = Math.min(0.05, clock.getDelta());
      const elapsed = clock.elapsedTime;
      const latest = propsRef.current;

      // Smooth pointer parallax
      const pLerp = Math.min(1, delta * 5);
      currentParallaxX = THREE.MathUtils.lerp(currentParallaxX, targetParallaxX, pLerp);
      currentParallaxY = THREE.MathUtils.lerp(currentParallaxY, targetParallaxY, pLerp);

      // Dynamic Colorway Lighting Engine interpolation
      targetPrimaryColor.set(latest.primaryGlowHex || '#CCFF00');
      targetSecondaryColor.set(latest.secondaryAccentHex || '#10B981');
      const colorLerp = Math.min(1, delta * 5);
      rimLight.color.lerp(targetPrimaryColor, colorLerp);
      underGlow.color.lerp(targetPrimaryColor, colorLerp);
      innerBeamMat.color.lerp(targetPrimaryColor, colorLerp);
      fillLight.color.lerp(targetSecondaryColor, colorLerp);
      innerRingMat.color.lerp(targetPrimaryColor, colorLerp);
      outerRingMat.color.lerp(targetSecondaryColor, colorLerp);

      // Subtle pedestal pulse
      innerRingMat.opacity = 0.56 + Math.sin(elapsed * 2.1) * 0.14;
      pedestalGroup.rotation.y = elapsed * 0.12;

      if (
        latest.mode === 'hero-carousel' &&
        createdCarouselShoes.length > 0
      ) {
        const latestItems = latest.carouselItems || [];
        const inspectedIdx =
          typeof latest.inspectedIndex === 'number' &&
          latest.inspectedIndex >= 0 &&
          latest.inspectedIndex < createdCarouselShoes.length
            ? latest.inspectedIndex
            : null;
        const isInspecting = inspectedIdx !== null;
        const rawTargetPos =
          typeof latest.scrollIndex === 'number'
            ? latest.scrollIndex
            : latest.activeCarouselIndex ?? 0;
        smoothedScrollPos = THREE.MathUtils.lerp(
          smoothedScrollPos,
          rawTargetPos,
          Math.min(1, delta * 7.5)
        );
        const targetReveal = isInspecting ? 1 : (latest.carouselReveal ?? 1);
        smoothedReveal = THREE.MathUtils.lerp(
          smoothedReveal,
          targetReveal,
          Math.min(1, delta * 6.5)
        );
        const springLerp = Math.min(1, delta * 6.5);

        // Adjust lighting + Overhead Lamp descent between Starting Hero Banner and Lamp Carousel
        const bannerBrightFactor = (1 - smoothedReveal) * 0.42;
        ambientLight.intensity = THREE.MathUtils.lerp(
          ambientLight.intensity,
          isInspecting ? 0.72 : 0.24 + bannerBrightFactor,
          colorLerp
        );
        hemiLight.intensity = THREE.MathUtils.lerp(
          hemiLight.intensity,
          isInspecting ? 0.95 : 0.36 + bannerBrightFactor,
          colorLerp
        );
        topFill.intensity = THREE.MathUtils.lerp(
          topFill.intensity,
          isInspecting ? 1.35 : 0.34 + bannerBrightFactor * 1.4,
          colorLerp
        );
        keySpot.intensity = THREE.MathUtils.lerp(
          keySpot.intensity,
          isInspecting ? 46 : 24 + bannerBrightFactor * 22,
          colorLerp
        );
        overheadSpot.intensity = THREE.MathUtils.lerp(
          overheadSpot.intensity,
          isInspecting ? 88 : 42 + smoothedReveal * 75,
          colorLerp
        );
        beamMat.opacity = THREE.MathUtils.lerp(
          beamMat.opacity,
          isInspecting ? 0.035 : smoothedReveal * 0.072,
          colorLerp
        );
        lampGroup.position.y = isInspecting ? 0 : (1 - smoothedReveal) * 1.45;
        lampGroup.visible = true;
        pedestalGroup.position.x = isInspecting ? 0 : (1 - smoothedReveal) * 1.25;
        overheadSpot.position.x = isInspecting ? 0 : (1 - smoothedReveal) * 1.25;
        overheadSpot.target.position.x = isInspecting ? 0 : (1 - smoothedReveal) * 1.25;

        if (controls) {
          if (isInspecting) {
            controls.enableZoom = true;
            controls.minDistance = 2.4;
            controls.maxDistance = 6.2;
            controls.minPolarAngle = 0.18;
            controls.maxPolarAngle = Math.PI * 0.82;
            if (!wasInspecting) {
              controls.target.set(0, 0.04, 0.45);
              camera.position.set(1.85, 0.72, 3.65);
            }
          } else {
            controls.enableZoom = false;
            controls.minPolarAngle = Math.PI * 0.38;
            controls.maxPolarAngle = Math.PI * 0.54;
            if (wasInspecting) {
              exitCameraResetTimer = 0.65;
            }
            if (exitCameraResetTimer > 0) {
              exitCameraResetTimer = Math.max(0, exitCameraResetTimer - delta);
              camera.position.lerp(
                desiredCamPos.set(0, 0.32, 5.45),
                Math.min(1, delta * 6.5)
              );
              controls.target.lerp(
                desiredCamTarget.set(0, 0, 0.15),
                Math.min(1, delta * 6.5)
              );
            }
          }
        }
        wasInspecting = isInspecting;

        createdCarouselShoes.forEach((shoe, idx) => {
          const itemMeta = latestItems[idx];

          if (isInspecting) {
            const isSelected = idx === inspectedIdx;
            if (isSelected) {
              shoe.group.visible = true;
              shoe.group.position.x = THREE.MathUtils.lerp(shoe.group.position.x, 0, springLerp);
              shoe.group.position.y = THREE.MathUtils.lerp(
                shoe.group.position.y,
                0.04 + Math.sin(elapsed * 1.45) * 0.03,
                springLerp
              );
              shoe.group.position.z = THREE.MathUtils.lerp(shoe.group.position.z, 0.45, springLerp);
              shoe.group.scale.setScalar(
                THREE.MathUtils.lerp(shoe.group.scale.x, 1.38, springLerp)
              );

              const inspectProg = latest.inspectScrollProgress ?? 0;
              const targetSpinY = -0.45 + inspectProg * Math.PI * 2;
              shoe.group.rotation.y = THREE.MathUtils.lerp(
                shoe.group.rotation.y,
                targetSpinY,
                springLerp
              );
              shoe.group.rotation.x = THREE.MathUtils.lerp(shoe.group.rotation.x, 0.06, springLerp);
              shoe.group.rotation.z = THREE.MathUtils.lerp(shoe.group.rotation.z, 0.04, springLerp);

              shoe.update(elapsed, delta, {
                primaryGlowHex: latest.primaryGlowHex,
                secondaryAccentHex: latest.secondaryAccentHex,
                autoFloat: true,
                deconstructFactor: Math.sin(inspectProg * Math.PI) * 0.22,
              });
            } else {
              shoe.group.scale.setScalar(
                THREE.MathUtils.lerp(shoe.group.scale.x, 0.001, springLerp * 1.4)
              );
              shoe.group.visible = shoe.group.scale.x > 0.025;
            }
            return;
          }

          // Blend between Starting Hero Banner centerpiece (reveal=0) and Full Overhead Lamp Row (reveal=1)
          const offset = idx - smoothedScrollPos;
          const distFromLamp = Math.abs(offset);
          const spotlightProximity = Math.max(0, 1 - distFromLamp / 1.1);
          const isSpotlightCenter = distFromLamp < 0.45 || (idx === 0 && smoothedReveal < 0.4);

          const rowX = offset * 2.15;
          const rowY = -0.14 + spotlightProximity * 0.2;
          const rowZ = spotlightProximity * 0.68 - Math.min(1.1, distFromLamp * 0.25);
          const rowScale = 0.7 + spotlightProximity * 0.48;

          const targetX =
            idx === 0
              ? THREE.MathUtils.lerp(1.25, rowX, smoothedReveal)
              : rowX + (1 - smoothedReveal) * 2.2;
          const targetY =
            idx === 0
              ? THREE.MathUtils.lerp(-0.02, rowY, smoothedReveal)
              : rowY - (1 - smoothedReveal) * 0.45;
          const targetZ =
            idx === 0
              ? THREE.MathUtils.lerp(0.85, rowZ, smoothedReveal)
              : rowZ - (1 - smoothedReveal) * 1.5;
          const targetScale =
            idx === 0
              ? THREE.MathUtils.lerp(1.28, rowScale, smoothedReveal)
              : rowScale * Math.max(0.001, smoothedReveal);

          shoe.group.position.x = THREE.MathUtils.lerp(
            shoe.group.position.x,
            targetX,
            springLerp
          );
          shoe.group.position.z = THREE.MathUtils.lerp(
            shoe.group.position.z,
            targetZ,
            springLerp
          );
          shoe.group.scale.setScalar(
            THREE.MathUtils.lerp(shoe.group.scale.x, targetScale, springLerp)
          );
          shoe.group.visible = idx === 0 || shoe.group.scale.x > 0.035;

          const clampedYaw = Math.max(-0.45, Math.min(0.45, offset * 0.14));
          const targetRotY = isSpotlightCenter
            ? -0.48 + Math.sin(elapsed * 0.55) * 0.12 + currentParallaxX * 0.12
            : -0.5 - clampedYaw;
          const targetRotX = isSpotlightCenter ? 0.05 + currentParallaxY * 0.07 : 0.03;
          const targetRotZ = isSpotlightCenter ? 0.06 : -clampedYaw * 0.08;

          shoe.group.rotation.y = THREE.MathUtils.lerp(
            shoe.group.rotation.y,
            targetRotY,
            springLerp
          );
          shoe.group.rotation.x = THREE.MathUtils.lerp(
            shoe.group.rotation.x,
            targetRotX,
            springLerp
          );
          shoe.group.rotation.z = THREE.MathUtils.lerp(
            shoe.group.rotation.z,
            targetRotZ,
            springLerp
          );

          shoe.update(elapsed, delta, {
            primaryGlowHex: isSpotlightCenter
              ? latest.primaryGlowHex
              : itemMeta?.primaryGlowHex || '#CCFF00',
            secondaryAccentHex: isSpotlightCenter
              ? latest.secondaryAccentHex
              : itemMeta?.secondaryAccentHex || '#10B981',
            autoFloat: isSpotlightCenter,
            deconstructFactor: 0,
          });

          const floatOffset = isSpotlightCenter ? Math.sin(elapsed * 1.45) * 0.04 : 0;
          shoe.group.position.y = THREE.MathUtils.lerp(
            shoe.group.position.y,
            targetY + floatOffset,
            springLerp
          );
        });
      } else if (singleSneakerRef.current) {
        if (latest.mode === 'scrollytelling') {
          const progress = latest.scrollProgress ?? 0;
          const pct = Math.max(0, Math.min(100, progress * 100));
          const sorted = [...(latest.hotspots || [])].sort(
            (a, b) => a.scrollPercentage - b.scrollPercentage
          );

          if (sorted.length >= 2) {
            let lower = sorted[0];
            let upper = sorted[sorted.length - 1];
            for (let i = 0; i < sorted.length - 1; i++) {
              if (
                pct >= sorted[i].scrollPercentage &&
                pct <= sorted[i + 1].scrollPercentage
              ) {
                lower = sorted[i];
                upper = sorted[i + 1];
                break;
              }
            }
            if (pct <= sorted[0].scrollPercentage) {
              lower = sorted[0];
              upper = sorted[0];
            } else if (pct >= sorted[sorted.length - 1].scrollPercentage) {
              lower = sorted[sorted.length - 1];
              upper = sorted[sorted.length - 1];
            }
            const span = upper.scrollPercentage - lower.scrollPercentage;
            const alpha = span > 0 ? (pct - lower.scrollPercentage) / span : 0;

            desiredCamPos.set(
              THREE.MathUtils.lerp(
                lower.cameraPosition.x,
                upper.cameraPosition.x,
                alpha
              ),
              THREE.MathUtils.lerp(
                lower.cameraPosition.y,
                upper.cameraPosition.y,
                alpha
              ),
              THREE.MathUtils.lerp(
                lower.cameraPosition.z,
                upper.cameraPosition.z,
                alpha
              )
            );
            desiredCamTarget.set(
              THREE.MathUtils.lerp(
                lower.cameraTarget.x,
                upper.cameraTarget.x,
                alpha
              ),
              THREE.MathUtils.lerp(
                lower.cameraTarget.y,
                upper.cameraTarget.y,
                alpha
              ),
              THREE.MathUtils.lerp(
                lower.cameraTarget.z,
                upper.cameraTarget.z,
                alpha
              )
            );
          }

          camera.position.lerp(desiredCamPos, Math.min(1, delta * 4.5));
          currentCamTarget.lerp(desiredCamTarget, Math.min(1, delta * 4.5));
          camera.lookAt(currentCamTarget);

          const targetRotY = progress * Math.PI * 2 - 0.35;
          singleSpinWrapper.rotation.y = THREE.MathUtils.lerp(
            singleSpinWrapper.rotation.y,
            targetRotY,
            Math.min(1, delta * 6)
          );

          singleSneakerRef.current.update(elapsed, delta, {
            primaryGlowHex: latest.primaryGlowHex,
            secondaryAccentHex: latest.secondaryAccentHex,
            deconstructFactor: Math.sin(progress * Math.PI) * 0.92,
            autoFloat: true,
          });
        } else {
          singleSneakerRef.current.update(elapsed, delta, {
            primaryGlowHex: latest.primaryGlowHex,
            secondaryAccentHex: latest.secondaryAccentHex,
            deconstructFactor: latest.deconstructFactor ?? 0,
            autoFloat: true,
          });
        }
      }

      controls?.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls?.dispose();
      controlsRef.current = null;
      singleSneakerRef.current?.dispose();
      singleSneakerRef.current = null;
      createdCarouselShoes.forEach((s) => s.dispose());
      carouselSneakersRef.current = [];
      innerRingGeo.dispose();
      innerRingMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      crosshairGeos.forEach((g) => g.dispose());
      crosshairMat.dispose();
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
      lampHousingGeo.dispose();
      lampHousingMat.dispose();
      lampBarGeo.dispose();
      lampBarMat.dispose();
      rodGeo.dispose();
      beamGeo.dispose();
      beamMat.dispose();
      innerBeamGeo.dispose();
      innerBeamMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [props.mode, props.silhouetteVariant, carouselIdentityKey]);

  // Update remote GLB asset URL dynamically without remounting WebGL context
  useEffect(() => {
    singleSneakerRef.current?.setGlbUrl(props.glbModelUrl);
  }, [props.glbModelUrl]);

  // Update active carousel shoe GLB URLs dynamically when variants switch
  useEffect(() => {
    if (props.mode !== 'hero-carousel') return;
    (props.carouselItems || []).forEach((item, idx) => {
      carouselSneakersRef.current[idx]?.setGlbUrl(item.glbModelUrl);
    });
  }, [props.mode, props.carouselItems]);

  // Handle Admin Studio hotspot camera fly-to previews
  useEffect(() => {
    if (!props.previewCamera || !cameraRef.current || !controlsRef.current) {
      return;
    }
    cameraRef.current.position.set(
      props.previewCamera.position.x,
      props.previewCamera.position.y,
      props.previewCamera.position.z
    );
    controlsRef.current.target.set(
      props.previewCamera.target.x,
      props.previewCamera.target.y,
      props.previewCamera.target.z
    );
    controlsRef.current.update();
  }, [props.previewCamera]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-grab active:cursor-grabbing"
    />
  );
}
