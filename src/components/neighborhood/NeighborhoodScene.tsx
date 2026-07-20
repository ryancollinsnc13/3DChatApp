import {
  ContactShadows,
  Html,
  OrbitControls,
  Sparkles,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import {
  ACESFilmicToneMapping,
  Color,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Group } from "three";
import type { House, HousePreset, HouseSlot, Neighborhood } from "../../types/models";
import { AvatarModel3D } from "../avatar/AvatarModel3D";

type NeighborhoodSceneProps = {
  neighborhood: Neighborhood;
  exteriorPresets: HousePreset[];
  activeRoomSlot: HouseSlot | null;
  invitedSlots: HouseSlot[];
  roomHouse: House | null;
  onEnterHome: () => void;
  onExitRoom: () => void;
};

const homePlotPosition: [number, number, number] = [0, 0, 0];

const emptyPlotPositions: Array<{ id: number; position: [number, number, number] }> = [
  { id: 1, position: [-3.2, 0, -2.7] },
  { id: 2, position: [0, 0, -2.7] },
  { id: 3, position: [3.2, 0, -2.7] },
  { id: 4, position: [-3.2, 0, 0] },
  { id: 5, position: [3.2, 0, 0] },
  { id: 6, position: [-3.2, 0, 2.7] },
  { id: 7, position: [0, 0, 2.7] },
  { id: 8, position: [3.2, 0, 2.7] },
];

const modelPaths = {
  decorPlant: "/models/game/decor-plant.glb",
  furnitureKit: "/models/game/furniture-kit.glb",
  houseKit: "/models/game/house-kit.glb",
  roomShell: "/models/game/room-shell.glb",
  avocado: "/models/Avocado.glb",
  corset: "/models/Corset.glb",
  toyCar: "/models/ToyCar.glb",
};

type ModelName = keyof typeof modelPaths;
type ScenePosition = [number, number, number];

type MovementBounds = {
  maxX: number;
  maxZ: number;
  minX: number;
  minZ: number;
};

const exteriorMovementBounds: MovementBounds = { maxX: 4.65, maxZ: 3.95, minX: -4.65, minZ: -3.95 };
const interiorMovementBounds: MovementBounds = { maxX: 1.7, maxZ: 1.45, minX: -1.7, minZ: -1.45 };
const characterMoveSpeed = 2.45;
const movementStopDistance = 0.035;
const starterForwardCorrection = Math.PI;

function clampValue(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function constrainTarget(position: ScenePosition, bounds: MovementBounds, y: number): ScenePosition {
  return [clampValue(position[0], bounds.minX, bounds.maxX), y, clampValue(position[2], bounds.minZ, bounds.maxZ)];
}

function shortestAngleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function dampAngle(from: number, to: number, lambda: number, delta: number) {
  return from + shortestAngleDelta(from, to) * (1 - Math.exp(-lambda * delta));
}

function presetFor(slot: HouseSlot, presets: HousePreset[]) {
  return presets.find((preset) => preset.presetId === slot.exteriorPreset) ?? presets[0];
}

function presenceColor(presence: HouseSlot["presence"]) {
  if (presence === "online") {
    return "#3aa56d";
  }
  if (presence === "away") {
    return "#f2b84b";
  }
  return "#8b96a3";
}

function tuneModelMaterials(root: Object3D) {
  root.traverse((child) => {
    if (!(child instanceof Mesh)) {
      return;
    }
    child.castShadow = true;
    child.receiveShadow = true;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (material instanceof MeshStandardMaterial || material instanceof MeshPhysicalMaterial) {
        material.envMapIntensity = 1.35;
        material.needsUpdate = true;
      }
    });
  });
}

function cloneAndTuneScene(root: Object3D) {
  const scene = root.clone(true);
  scene.traverse((child) => {
    if (!(child instanceof Mesh)) {
      return;
    }
    child.castShadow = true;
    child.receiveShadow = true;
    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => material.clone());
    } else {
      child.material = child.material.clone();
    }
  });
  tuneModelMaterials(scene);
  return scene;
}

function RealModel({
  name,
  position,
  rotation = [0, 0, 0],
  scale = 1,
}: {
  name: ModelName;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  const gltf = useGLTF(modelPaths[name]);
  const scene = useMemo(() => cloneAndTuneScene(gltf.scene), [gltf.scene]);

  useEffect(() => {
    tuneModelMaterials(scene);
  }, [scene]);

  return <primitive object={scene} position={position} rotation={rotation} scale={scale} />;
}

function applyMaterialColor(root: Object3D, matcher: (name: string) => boolean, color: string) {
  root.traverse((child) => {
    if (!(child instanceof Mesh) || !matcher(child.name)) {
      return;
    }
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (material instanceof MeshStandardMaterial || material instanceof MeshPhysicalMaterial) {
        material.color.set(color);
        material.needsUpdate = true;
      }
    });
  });
}

function GameHouseModel({ preset, scale = 1 }: { preset: HousePreset; scale?: number }) {
  const gltf = useGLTF(modelPaths.houseKit);
  const scene = useMemo(() => cloneAndTuneScene(gltf.scene), [gltf.scene]);

  useEffect(() => {
    applyMaterialColor(scene, (name) => name.includes("WALL"), preset.wallColor);
    applyMaterialColor(scene, (name) => name.includes("ROOF"), preset.roofColor);
    applyMaterialColor(scene, (name) => name.includes("TRIM") || name.includes("DOOR"), preset.trimColor);
  }, [preset, scene]);

  return <primitive object={scene} scale={scale} />;
}

function GameKitModel({
  name,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
}: {
  name: Extract<ModelName, "roomShell" | "furnitureKit" | "decorPlant">;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
}) {
  const gltf = useGLTF(modelPaths[name]);
  const scene = useMemo(() => cloneAndTuneScene(gltf.scene), [gltf.scene]);
  return <primitive object={scene} position={position} rotation={rotation} scale={scale} />;
}

function PremiumMaterial({
  color,
  emissive,
  roughness = 0.5,
  metalness = 0.05,
  clearcoat = 0.55,
}: {
  color: string;
  emissive?: string;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
}) {
  return (
    <meshPhysicalMaterial
      clearcoat={clearcoat}
      clearcoatRoughness={0.22}
      color={color}
      emissive={emissive ?? "#000000"}
      emissiveIntensity={emissive ? 0.1 : 0}
      envMapIntensity={1.4}
      ior={1.42}
      metalness={metalness}
      roughness={roughness}
      sheen={0.35}
      sheenColor={new Color(color).offsetHSL(0, -0.1, 0.18)}
      sheenRoughness={0.65}
    />
  );
}

function WalkingCharacter({
  slot,
  basePosition,
  movementBounds,
  scale = 0.88,
  targetPosition = null,
}: {
  slot: HouseSlot;
  basePosition: ScenePosition;
  movementBounds?: MovementBounds;
  scale?: number;
  targetPosition?: ScenePosition | null;
}) {
  const groupRef = useRef<Group>(null);
  const targetRef = useRef<Vector3 | null>(null);
  const hasPlacedRef = useRef(false);
  const speedRef = useRef(0);
  const walkingRef = useRef(false);
  const [isWalking, setIsWalking] = useState(false);
  const sceneForwardCorrection = slot.avatarModel?.sourceType === "upload" ? 0 : starterForwardCorrection;

  const setWalkingState = useCallback((nextWalking: boolean) => {
    if (walkingRef.current === nextWalking) {
      return;
    }
    walkingRef.current = nextWalking;
    setIsWalking(nextWalking);
  }, []);

  useEffect(() => {
    const group = groupRef.current;
    if (!targetPosition || !group) {
      targetRef.current = null;
      setWalkingState(false);
      return;
    }

    const nextTarget = movementBounds
      ? constrainTarget(targetPosition, movementBounds, basePosition[1])
      : ([targetPosition[0], basePosition[1], targetPosition[2]] as ScenePosition);
    targetRef.current = new Vector3(nextTarget[0], nextTarget[1], nextTarget[2]);
    const distanceToTarget = Math.hypot(group.position.x - nextTarget[0], group.position.z - nextTarget[2]);
    setWalkingState(distanceToTarget > movementStopDistance);
  }, [basePosition, movementBounds, setWalkingState, targetPosition]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) {
      return;
    }

    const group = groupRef.current;
    if (!hasPlacedRef.current) {
      group.position.set(basePosition[0], basePosition[1], basePosition[2]);
      hasPlacedRef.current = true;
    }

    const target = targetRef.current;
    if (!target) {
      group.position.y = basePosition[1];
      group.rotation.x = 0;
      group.rotation.z = 0;
      speedRef.current = 0;
      setWalkingState(false);
      return;
    }

    const dx = target.x - group.position.x;
    const dz = target.z - group.position.z;
    const distance = Math.hypot(dx, dz);

    if (distance <= movementStopDistance) {
      group.position.set(target.x, basePosition[1], target.z);
      targetRef.current = null;
      speedRef.current = 0;
      setWalkingState(false);
      return;
    }

    const desiredSpeed = distance < 0.5 ? characterMoveSpeed * Math.max(distance / 0.5, 0.35) : characterMoveSpeed;
    speedRef.current = MathUtils.damp(speedRef.current, desiredSpeed, 8, delta);
    const step = Math.min(distance, Math.max(speedRef.current, characterMoveSpeed * 0.18) * delta);
    group.position.x += (dx / distance) * step;
    group.position.z += (dz / distance) * step;
    group.position.y = basePosition[1];
    group.rotation.y = dampAngle(group.rotation.y, Math.atan2(dx, dz) + sceneForwardCorrection, 12, delta);
    group.rotation.z = Math.sin(clock.getElapsedTime() * 7.2) * 0.008;
    setWalkingState(true);
  });

  return (
    <group ref={groupRef}>
      <Suspense fallback={null}>
        <AvatarModel3D config={slot.avatarConfig} model={slot.avatarModel} scale={scale} walking={isWalking} />
      </Suspense>
      <Html center distanceFactor={8} position={[0, 1.34, 0]}>
        <span
          className="scene-character-label"
          data-center-x={slot.avatarModel?.xOffset ?? 0}
          data-center-z={slot.avatarModel?.zOffset ?? 0}
          data-motion={isWalking ? "walk" : "idle"}
          data-turn={slot.avatarModel?.rotationY ?? 0}
          data-testid={`scene-character-${slot.ownerPlayerId}`}
        >
          {slot.displayName}
        </span>
      </Html>
    </group>
  );
}

function FocusHomeCamera() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 5.4, 6.4);
    camera.lookAt(0, 0.3, 0);
    camera.updateProjectionMatrix();
  }, [camera]);

  return null;
}

function PlotBase({ occupied = false }: { occupied?: boolean }) {
  const baseColor = occupied ? "#fff6cf" : "#d8efe0";

  return (
    <group>
      <mesh position={[0, 0.035, 0]} receiveShadow>
        <boxGeometry args={[2.35, 0.07, 1.95]} />
        <PremiumMaterial clearcoat={0.26} color={baseColor} roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.085, -0.98]} receiveShadow>
        <boxGeometry args={[2.42, 0.04, 0.06]} />
        <PremiumMaterial clearcoat={0.18} color="#f7e7c8" roughness={0.58} />
      </mesh>
      <mesh position={[0, 0.086, 0.98]} receiveShadow>
        <boxGeometry args={[2.42, 0.04, 0.06]} />
        <PremiumMaterial clearcoat={0.18} color="#f7e7c8" roughness={0.58} />
      </mesh>
      <mesh position={[-1.21, 0.087, 0]} receiveShadow>
        <boxGeometry args={[0.06, 0.04, 2.02]} />
        <PremiumMaterial clearcoat={0.18} color="#f7e7c8" roughness={0.58} />
      </mesh>
      <mesh position={[1.21, 0.087, 0]} receiveShadow>
        <boxGeometry args={[0.06, 0.04, 2.02]} />
        <PremiumMaterial clearcoat={0.18} color="#f7e7c8" roughness={0.58} />
      </mesh>
    </group>
  );
}

function EmptyPlot({
  id,
  onMoveToPlot,
  position,
}: {
  id: number;
  onMoveToPlot: (position: ScenePosition) => void;
  position: ScenePosition;
}) {
  return (
    <group position={position}>
      <PlotBase />
      <mesh position={[0, 0.18, 0]} castShadow>
        <boxGeometry args={[0.74, 0.08, 0.34]} />
        <PremiumMaterial clearcoat={0.22} color="#fffaf2" roughness={0.54} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.08, 0.48, 0.08]} />
        <PremiumMaterial clearcoat={0.18} color="#2f5d50" roughness={0.5} />
      </mesh>
      <Html center distanceFactor={11} position={[0, 0.82, 0]}>
        <button
          className="scene-plot-label"
          data-testid={`empty-plot-${id}`}
          onClick={() => onMoveToPlot(position)}
          type="button"
        >
          Empty plot
        </button>
      </Html>
    </group>
  );
}

function CurrentHousePlot({
  characterTarget,
  onEnterHome,
  preset,
  slot,
}: {
  characterTarget: ScenePosition | null;
  onEnterHome: () => void;
  preset: HousePreset;
  slot: HouseSlot;
}) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onEnterHome();
  };

  return (
    <group position={homePlotPosition} onClick={handleClick}>
      <PlotBase occupied />
      <Suspense fallback={null}>
        <group position={[0, 0.08, 0]}>
          <GameHouseModel preset={preset} scale={1.08} />
        </group>
      </Suspense>
      <mesh position={[0.55, 1.12, 0.15]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshPhysicalMaterial
          clearcoat={1}
          color={presenceColor(slot.presence)}
          emissive={presenceColor(slot.presence)}
          emissiveIntensity={0.42}
          roughness={0.2}
        />
      </mesh>
      <WalkingCharacter
        basePosition={[0.72, 0.08, -0.54]}
        movementBounds={exteriorMovementBounds}
        scale={0.45}
        slot={slot}
        targetPosition={characterTarget}
      />
    </group>
  );
}

function NeighborhoodExterior({
  exteriorPresets,
  homeSlot,
  onEnterHome,
}: {
  exteriorPresets: HousePreset[];
  homeSlot: HouseSlot;
  onEnterHome: () => void;
}) {
  const orbitTarget = useMemo(() => new Vector3(homePlotPosition[0], 0.24, homePlotPosition[2]), []);
  const [characterTarget, setCharacterTarget] = useState<ScenePosition | null>(null);

  const moveCharacterTo = useCallback((position: ScenePosition) => {
    setCharacterTarget(constrainTarget(position, exteriorMovementBounds, 0.08));
  }, []);

  const handleGroundClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      moveCharacterTo([event.point.x, 0.08, event.point.z]);
    },
    [moveCharacterTo],
  );

  return (
    <>
      <color attach="background" args={["#bde9ff"]} />
      <fog attach="fog" args={["#bde9ff", 14, 28]} />
      <FocusHomeCamera />
      <ambientLight intensity={0.46} />
      <hemisphereLight color="#fff7d0" groundColor="#5fae7b" intensity={0.95} />
      <directionalLight
        castShadow
        intensity={1.65}
        position={[4, 7, 4]}
        shadow-bias={-0.0002}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />
      <pointLight color="#f2b84b" intensity={1.1} position={[-2.6, 2.2, 2.4]} />
      <group onClick={handleGroundClick}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[10.5, 9.2]} />
          <PremiumMaterial clearcoat={0.2} color="#8bd3a7" roughness={0.74} />
        </mesh>
        <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10.1, 0.34]} />
          <PremiumMaterial clearcoat={0.32} color="#fff6cf" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.019, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[8.8, 0.34]} />
          <PremiumMaterial clearcoat={0.32} color="#fff6cf" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.02, -1.35]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10.1, 0.18]} />
          <PremiumMaterial clearcoat={0.32} color="#fff6cf" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.021, 1.35]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10.1, 0.18]} />
          <PremiumMaterial clearcoat={0.32} color="#fff6cf" roughness={0.5} />
        </mesh>
        <mesh position={[-1.6, 0.022, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[8.8, 0.18]} />
          <PremiumMaterial clearcoat={0.32} color="#fff6cf" roughness={0.5} />
        </mesh>
        <mesh position={[1.6, 0.023, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
          <planeGeometry args={[8.8, 0.18]} />
          <PremiumMaterial clearcoat={0.32} color="#fff6cf" roughness={0.5} />
        </mesh>
        {emptyPlotPositions.map((plot) => (
          <EmptyPlot key={plot.id} id={plot.id} onMoveToPlot={moveCharacterTo} position={plot.position} />
        ))}
      </group>
      <Sparkles color="#ffffff" count={18} noise={0.7} opacity={0.34} scale={[9, 1.2, 8]} size={2} speed={0.16} />
      <CurrentHousePlot
        characterTarget={characterTarget}
        onEnterHome={onEnterHome}
        preset={presetFor(homeSlot, exteriorPresets)}
        slot={homeSlot}
      />
      <ContactShadows blur={3} opacity={0.34} position={[0, 0.01, 0]} scale={9} />
      <OrbitControls
        enableDamping
        enablePan={false}
        enableZoom
        makeDefault
        maxDistance={9}
        maxPolarAngle={Math.PI / 2.18}
        minDistance={4.2}
        minPolarAngle={Math.PI / 4.4}
        target={orbitTarget}
      />
    </>
  );
}

function InteriorScene({
  roomSlot,
  invitedSlots,
  roomHouse,
  onExitRoom,
}: {
  roomSlot: HouseSlot;
  invitedSlots: HouseSlot[];
  roomHouse: House | null;
  onExitRoom: () => void;
}) {
  const guests = [roomSlot, ...invitedSlots.filter((slot) => slot.ownerPlayerId !== roomSlot.ownerPlayerId)];
  const guestPositions: Array<[number, number, number]> = [
    [-0.85, 0, 0.15],
    [0.82, 0, 0.05],
    [0.05, 0, 0.78],
    [-1.15, 0, 0.85],
  ];
  const [roomCharacterTarget, setRoomCharacterTarget] = useState<ScenePosition | null>(null);

  const moveRoomCharacterTo = useCallback((position: ScenePosition) => {
    setRoomCharacterTarget(constrainTarget(position, interiorMovementBounds, 0));
  }, []);

  const handleFloorClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      moveRoomCharacterTo([event.point.x, 0, event.point.z]);
    },
    [moveRoomCharacterTo],
  );

  return (
    <>
      <color attach="background" args={["#fff6cf"]} />
      <fog attach="fog" args={["#fff6cf", 14, 20]} />
      <ambientLight intensity={0.48} />
      <hemisphereLight color="#fff7d0" groundColor="#ffe1aa" intensity={1.05} />
      <directionalLight
        castShadow
        intensity={1.35}
        position={[3, 5, 4]}
        shadow-bias={-0.0002}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />
      <pointLight color="#f2b84b" intensity={1.3} position={[0, 2.1, 1.2]} />
      <pointLight color="#bde9ff" intensity={0.8} position={[-1.8, 1.6, -1.4]} />
      <mesh onClick={handleFloorClick} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[4.6, 4]} />
        <PremiumMaterial clearcoat={0.24} color="#ffe1aa" roughness={0.66} />
      </mesh>
      <Suspense fallback={null}>
        <GameKitModel name="roomShell" />
        <GameKitModel name="furnitureKit" />
        <GameKitModel name="decorPlant" position={[-1.88, 0, 1.25]} scale={1.2} />
        <RealModel name="avocado" position={[1.35, 0.27, -0.74]} rotation={[0, -0.4, 0]} scale={7.5} />
        <RealModel name="corset" position={[1.62, 0.02, 1.16]} rotation={[0, -0.6, 0]} scale={0.42} />
      </Suspense>
      <Sparkles color="#fff9d6" count={18} noise={0.55} opacity={0.34} scale={[3.6, 1.4, 3.2]} size={1.8} speed={0.14} />
      {guests.map((slot, index) => (
        <WalkingCharacter
          basePosition={guestPositions[index] ?? [0, 0, 0]}
          key={slot.ownerPlayerId}
          movementBounds={interiorMovementBounds}
          scale={0.82}
          slot={slot}
          targetPosition={index === 0 ? roomCharacterTarget : null}
        />
      ))}
      <Html center distanceFactor={7} position={[0, 2.25, 1.2]}>
        <div className="scene-room-banner" data-testid="room-banner">
          <span>{roomHouse?.name ?? `${roomSlot.displayName}'s room`}</span>
          <button type="button" onClick={onExitRoom} data-testid="exit-room">
            Outside
          </button>
        </div>
      </Html>
      <ContactShadows blur={3} opacity={0.32} position={[0, 0.01, 0]} scale={4.4} />
      <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2.15} minPolarAngle={Math.PI / 3.1} />
    </>
  );
}

export function NeighborhoodScene({
  neighborhood,
  exteriorPresets,
  activeRoomSlot,
  invitedSlots,
  roomHouse,
  onEnterHome,
  onExitRoom,
}: NeighborhoodSceneProps) {
  return (
    <section className="scene-shell" aria-label={activeRoomSlot ? "House interior" : "Neighborhood map"}>
      <Canvas
        camera={{ position: activeRoomSlot ? [0, 3.1, 4.4] : [0, 5.4, 6.4], fov: activeRoomSlot ? 48 : 43 }}
        data-testid="neighborhood-canvas"
        dpr={[1.5, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        key={activeRoomSlot?.ownerPlayerId ?? "neighborhood"}
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = activeRoomSlot ? 1.12 : 1.05;
          gl.outputColorSpace = SRGBColorSpace;
          gl.shadowMap.enabled = true;
        }}
        shadows
      >
        {activeRoomSlot ? (
          <InteriorScene
            invitedSlots={invitedSlots}
            onExitRoom={onExitRoom}
            roomHouse={roomHouse}
            roomSlot={activeRoomSlot}
          />
        ) : (
          <NeighborhoodExterior
            exteriorPresets={exteriorPresets}
            homeSlot={neighborhood.homeSlot}
            onEnterHome={onEnterHome}
          />
        )}
      </Canvas>
    </section>
  );
}
