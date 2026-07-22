import {
  ContactShadows,
  Html,
  OrbitControls,
  Sparkles,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import {
  ACESFilmicToneMapping,
  Box3,
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
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { House, HousePreset, HouseSlot, Neighborhood } from "../../types/models";
import { AvatarModel3D } from "../avatar/AvatarModel3D";

type NeighborhoodSceneProps = {
  neighborhood: Neighborhood;
  exteriorPresets: HousePreset[];
  activeRoomSlot: HouseSlot | null;
  invitedSlots: HouseSlot[];
  roomHouse: House | null;
  onAddFriendHouse: () => void;
  onEnterHome: () => void;
  onExitRoom: () => void;
};

const homePlotPosition: [number, number, number] = [0, 0, 0];
const friendPlotPositions: ScenePosition[] = [
  [-6.1, 0, -0.85],
  [6.1, 0, -0.85],
  [-9.4, 0, -0.85],
  [9.4, 0, -0.85],
];

const modelPaths = {
  decorPlant: "/models/game/decor-plant.glb",
  furnitureKit: "/models/game/furniture-kit.glb",
  houseKit: "/models/game/house-kit.glb",
  playerHouse: "/models/home/house_with_interior.glb",
  natureBush: "/models/kenney-nature/plant_bushDetailed.glb",
  natureFlower: "/models/kenney-nature/flower_redA.glb",
  natureGrass: "/models/kenney-nature/grass.glb",
  natureRock: "/models/kenney-nature/rock_smallA.glb",
  natureSign: "/models/kenney-nature/sign.glb",
  natureTree: "/models/kenney-nature/tree_default.glb",
  natureTreeOak: "/models/kenney-nature/tree_oak.glb",
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

const exteriorMovementBounds: MovementBounds = { maxX: 10.6, maxZ: 4.65, minX: -10.6, minZ: -4.65 };
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

function GameHouseModel({ scale = 1 }: { scale?: number }) {
  const gltf = useGLTF(modelPaths.playerHouse);
  const scene = useMemo(() => {
    const normalizedScene = cloneAndTuneScene(gltf.scene);
    const bounds = new Box3().setFromObject(normalizedScene);
    const center = bounds.getCenter(new Vector3());
    let exteriorGroundY = bounds.min.y;
    normalizedScene.traverse((child) => {
      if (!(child instanceof Mesh)) {
        return;
      }
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      if (materials.some((material) => material.name === "Vonok")) {
        exteriorGroundY = new Box3().setFromObject(child).min.y;
      }
    });
    normalizedScene.position.set(-center.x, -exteriorGroundY, -center.z);
    return normalizedScene;
  }, [gltf.scene]);

  return (
    <group rotation={[0, -Math.PI / 2, 0]}>
      <primitive object={scene} scale={scale} />
    </group>
  );
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
  characterRef,
  movementBounds,
  scale = 0.88,
  targetPosition = null,
}: {
  slot: HouseSlot;
  basePosition: ScenePosition;
  characterRef?: RefObject<Group | null>;
  movementBounds?: MovementBounds;
  scale?: number;
  targetPosition?: ScenePosition | null;
}) {
  const internalGroupRef = useRef<Group>(null);
  const groupRef = characterRef ?? internalGroupRef;
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
  }, [basePosition, groupRef, movementBounds, setWalkingState, targetPosition]);

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

function FollowCharacterCamera({
  characterRef,
  enableZoom,
  maxDistance,
  minDistance,
  offset,
  targetHeight,
}: {
  characterRef: RefObject<Group | null>;
  enableZoom: boolean;
  maxDistance: number;
  minDistance: number;
  offset: ScenePosition;
  targetHeight: number;
}) {
  const { camera } = useThree();
  const vectorsRef = useRef({
    characterPosition: new Vector3(),
    lastTarget: new Vector3(),
    movementDelta: new Vector3(),
    orbitTarget: new Vector3(),
    offset: new Vector3(...offset),
  });
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const hasPositionedCamera = useRef(false);

  useFrame(() => {
    const character = characterRef.current;
    const controls = controlsRef.current;
    if (!character || !controls) {
      return;
    }

    const { characterPosition, lastTarget, movementDelta, orbitTarget, offset: offsetVector } = vectorsRef.current;
    character.getWorldPosition(characterPosition);
    orbitTarget.copy(characterPosition);
    orbitTarget.y += targetHeight;

    if (!hasPositionedCamera.current) {
      camera.position.copy(characterPosition).add(offsetVector);
      hasPositionedCamera.current = true;
    } else {
      movementDelta.copy(orbitTarget).sub(lastTarget);
      camera.position.add(movementDelta);
    }

    controls.target.copy(orbitTarget);
    lastTarget.copy(orbitTarget);
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      enablePan={false}
      enableRotate
      enableZoom={enableZoom}
      makeDefault
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI / 2.15}
      minDistance={minDistance}
      minPolarAngle={Math.PI / 4.4}
    />
  );
}

function NeighborhoodTree({ position, scale = 1 }: { position: ScenePosition; scale?: number }) {
  return (
    <group position={position}>
      <RealModel name="natureTreeOak" position={[0, 0, 0]} scale={scale * 1.35} />
      <RealModel name="natureGrass" position={[-0.35, 0, 0.22]} rotation={[0, 0.8, 0]} scale={scale * 0.8} />
      <RealModel name="natureRock" position={[0.34, 0, 0.16]} rotation={[0, 1.7, 0]} scale={scale * 0.55} />
    </group>
  );
}

function StreetLamp({ position }: { position: ScenePosition }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.18, 0.24, 0.2, 16]} />
        <PremiumMaterial color="#25363d" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 1.18, 0]}>
        <cylinderGeometry args={[0.055, 0.08, 2.18, 12]} />
        <PremiumMaterial color="#31474f" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh castShadow position={[0, 2.28, 0]}>
        <cylinderGeometry args={[0.25, 0.14, 0.16, 12]} />
        <PremiumMaterial color="#25363d" metalness={0.72} roughness={0.28} />
      </mesh>
      <mesh position={[0, 2.13, 0]}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshPhysicalMaterial color="#fff1ae" emissive="#ffd86b" emissiveIntensity={2.1} roughness={0.18} />
      </mesh>
      <pointLight color="#ffd982" distance={5.5} intensity={1.15} position={[0, 2.08, 0]} />
    </group>
  );
}

function FlowerBed({ position, rotation = 0 }: { position: ScenePosition; rotation?: number }) {
  const flowers = ["#ff7d8f", "#ffd166", "#a987d4", "#ff9f68"];
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh receiveShadow position={[0, 0.06, 0]}>
        <boxGeometry args={[1.65, 0.12, 0.42]} />
        <PremiumMaterial color="#6b4c35" roughness={0.96} />
      </mesh>
      {flowers.map((color, index) => (
        <group key={color} position={[-0.57 + index * 0.38, 0.18, index % 2 === 0 ? -0.04 : 0.06]}>
          <mesh castShadow position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.018, 0.022, 0.24, 6]} />
            <meshStandardMaterial color="#397e4b" />
          </mesh>
          <mesh castShadow position={[0, 0.27, 0]}>
            <sphereGeometry args={[0.09, 10, 10]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function YardFence() {
  const sidePosts = [-3.8, -2.85, -1.9, -0.95, 0, 0.95, 1.9, 2.85, 3.8];
  return (
    <group>
      {sidePosts.map((x) => (
        <mesh castShadow key={`back-${x}`} position={[x, 0.38, -4.38]}>
          <boxGeometry args={[0.11, 0.72, 0.11]} />
          <PremiumMaterial color="#f4e4c6" roughness={0.7} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.34, -4.38]}>
        <boxGeometry args={[7.8, 0.1, 0.09]} />
        <PremiumMaterial color="#ead5b2" roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0, 0.63, -4.38]}>
        <boxGeometry args={[7.8, 0.1, 0.09]} />
        <PremiumMaterial color="#ead5b2" roughness={0.72} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh castShadow position={[side * 5.72, 0.34, -1.15]}>
            <boxGeometry args={[0.09, 0.1, 6.45]} />
            <PremiumMaterial color="#ead5b2" roughness={0.72} />
          </mesh>
          <mesh castShadow position={[side * 5.72, 0.63, -1.15]}>
            <boxGeometry args={[0.09, 0.1, 6.45]} />
            <PremiumMaterial color="#ead5b2" roughness={0.72} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Mailbox({ displayName }: { displayName: string }) {
  return (
    <group position={[-1.75, 0, 2.15]} rotation={[0, 0.08, 0]}>
      <mesh castShadow position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.055, 0.07, 1.04, 10]} />
        <PremiumMaterial color="#385d68" metalness={0.35} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[0, 1.02, 0]}>
        <boxGeometry args={[0.56, 0.34, 0.34]} />
        <PremiumMaterial color="#4f7c87" metalness={0.28} roughness={0.38} />
      </mesh>
      <mesh castShadow position={[0.34, 1.13, 0]}>
        <boxGeometry args={[0.08, 0.38, 0.04]} />
        <PremiumMaterial color="#e85d5d" roughness={0.42} />
      </mesh>
      <Html center distanceFactor={9} position={[0, 1.42, 0]}>
        <span className="scene-character-label">{displayName}'s home</span>
      </Html>
    </group>
  );
}

function FriendHousePlot({
  onAddFriendHouse,
  position,
  slot,
}: {
  onAddFriendHouse: () => void;
  position: ScenePosition;
  slot?: HouseSlot;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.025, 0]} receiveShadow>
        <boxGeometry args={[2.85, 0.05, 3.5]} />
        <PremiumMaterial color={slot ? "#78b96f" : "#90c987"} roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.055, 1.72]} receiveShadow>
        <boxGeometry args={[2.95, 0.08, 0.12]} />
        <PremiumMaterial color="#d8d3c8" roughness={0.78} />
      </mesh>
      {slot ? (
        <>
          <Suspense fallback={null}>
            <RealModel name="houseKit" position={[0, 0.05, -0.25]} scale={1.22} />
            <RealModel name="natureBush" position={[-0.88, 0, 0.65]} scale={0.7} />
            <RealModel name="natureBush" position={[0.88, 0, 0.65]} rotation={[0, 1.2, 0]} scale={0.7} />
          </Suspense>
          <Html center distanceFactor={10} position={[0, 1.55, 0]}>
            <span className="scene-character-label">{slot.displayName}'s house</span>
          </Html>
        </>
      ) : (
        <>
          <Suspense fallback={null}>
            <RealModel name="natureSign" position={[0, 0, 0]} scale={0.85} />
          </Suspense>
          <Html center distanceFactor={10} position={[0, 1.05, 0]}>
            <button className="scene-add-friend-plot" onClick={onAddFriendHouse} type="button">
              <span>+</span>
              Add friend house
            </button>
          </Html>
        </>
      )}
    </group>
  );
}

function CurrentHousePlot({
  characterRef,
  characterTarget,
  onEnterHome,
  preset,
  slot,
}: {
  characterRef: RefObject<Group | null>;
  characterTarget: ScenePosition | null;
  onEnterHome: () => void;
  preset: HousePreset;
  slot: HouseSlot;
}) {
  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 3) {
      return;
    }
    onEnterHome();
  };

  return (
    <group position={homePlotPosition}>
      <group onClick={handleClick}>
        <Suspense fallback={null}>
          <group position={[0, 0, -0.85]}>
            <GameHouseModel scale={0.33} />
          </group>
        </Suspense>
        <mesh castShadow position={[-0.72, 0.04, 0.68]} receiveShadow>
          <boxGeometry args={[1.05, 0.08, 0.22]} />
          <PremiumMaterial color={preset.trimColor} roughness={0.7} />
        </mesh>
        <pointLight color="#ffd982" distance={4} intensity={1.15} position={[-0.72, 1.15, 0.45]} />
      </group>
      <Suspense fallback={null}>
        <RealModel name="natureBush" position={[-1.5, 0, 0.28]} scale={0.76} />
        <RealModel name="natureBush" position={[1.5, 0, 0.28]} rotation={[0, 1.4, 0]} scale={0.76} />
      </Suspense>
      <mesh position={[0.6, 1.48, 0.02]} castShadow>
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
        basePosition={[0.86, 0, 0.92]}
        characterRef={characterRef}
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
  houseSlots,
  homeSlot,
  onAddFriendHouse,
  onEnterHome,
}: {
  exteriorPresets: HousePreset[];
  houseSlots: HouseSlot[];
  homeSlot: HouseSlot;
  onAddFriendHouse: () => void;
  onEnterHome: () => void;
}) {
  const characterRef = useRef<Group>(null);
  const [characterTarget, setCharacterTarget] = useState<ScenePosition | null>(null);

  const moveCharacterTo = useCallback((position: ScenePosition) => {
    setCharacterTarget(constrainTarget(position, exteriorMovementBounds, 0));
  }, []);

  const handleGroundClick = useCallback(
    (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (event.delta > 3) {
        return;
      }
      moveCharacterTo([event.point.x, 0, event.point.z]);
    },
    [moveCharacterTo],
  );

  return (
    <>
      <color attach="background" args={["#bde9ff"]} />
      <fog attach="fog" args={["#bde9ff", 14, 28]} />
      <FollowCharacterCamera
        characterRef={characterRef}
        enableZoom
        maxDistance={16}
        minDistance={4.5}
        offset={[-0.86, 5.8, 7.8]}
        targetHeight={0.5}
      />
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
      <group onClick={handleGroundClick}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[23, 11]} />
          <PremiumMaterial clearcoat={0.14} color="#78bc72" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.045, 3.72]} receiveShadow>
          <boxGeometry args={[23, 0.09, 2.35]} />
          <PremiumMaterial clearcoat={0.12} color="#34434a" roughness={0.88} />
        </mesh>
        <mesh position={[0, 0.105, 2.35]} receiveShadow>
          <boxGeometry args={[23, 0.13, 0.58]} />
          <PremiumMaterial clearcoat={0.22} color="#d8d3c8" roughness={0.76} />
        </mesh>
        <mesh position={[0, 0.16, 2.68]} receiveShadow>
          <boxGeometry args={[23, 0.16, 0.12]} />
          <PremiumMaterial color="#b9b3a8" roughness={0.8} />
        </mesh>
        {[-10.2, -8.2, -6.2, -4.2, -2.2, -0.2, 1.8, 3.8, 5.8, 7.8, 9.8].map((x) => (
          <mesh key={x} position={[x, 0.105, 3.72]} receiveShadow>
            <boxGeometry args={[1.05, 0.025, 0.08]} />
            <meshStandardMaterial color="#f8e9a8" roughness={0.72} />
          </mesh>
        ))}
        <mesh position={[0, 0.1, 1.5]} receiveShadow>
          <boxGeometry args={[0.72, 0.08, 1.45]} />
          <PremiumMaterial color="#d8d3c8" roughness={0.78} />
        </mesh>
        <mesh position={[2.25, 0.085, 1.28]} receiveShadow>
          <boxGeometry args={[1.62, 0.07, 2.82]} />
          <PremiumMaterial color="#c7c3ba" roughness={0.82} />
        </mesh>
        <YardFence />
        <Suspense fallback={null}>
          <NeighborhoodTree position={[-4.15, 0, -3.05]} scale={1.08} />
          <NeighborhoodTree position={[4.15, 0, -3.1]} scale={1.12} />
        </Suspense>
        <StreetLamp position={[-8.5, 0, 2.48]} />
        <StreetLamp position={[-3.65, 0, 2.48]} />
        <StreetLamp position={[3.85, 0, 2.48]} />
        <StreetLamp position={[8.5, 0, 2.48]} />
        <FlowerBed position={[-2.3, 0.02, 0.05]} rotation={0.08} />
        <FlowerBed position={[2.35, 0.02, -0.15]} rotation={-0.08} />
        <Mailbox displayName={homeSlot.displayName} />
        {friendPlotPositions.map((position, index) => (
          <FriendHousePlot
            key={`${position[0]}-${position[2]}`}
            onAddFriendHouse={onAddFriendHouse}
            position={position}
            slot={houseSlots[index]}
          />
        ))}
      </group>
      <Sparkles color="#fff6c7" count={34} noise={0.75} opacity={0.28} scale={[20, 1.4, 8]} size={1.7} speed={0.14} />
      <CurrentHousePlot
        characterRef={characterRef}
        characterTarget={characterTarget}
        onEnterHome={onEnterHome}
        preset={presetFor(homeSlot, exteriorPresets)}
        slot={homeSlot}
      />
      <ContactShadows blur={3} opacity={0.36} position={[0, 0.015, 0]} scale={20} />
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
  const characterRef = useRef<Group>(null);
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
      if (event.delta > 3) {
        return;
      }
      moveRoomCharacterTo([event.point.x, 0, event.point.z]);
    },
    [moveRoomCharacterTo],
  );

  return (
    <>
      <color attach="background" args={["#fff6cf"]} />
      <fog attach="fog" args={["#fff6cf", 14, 20]} />
      <FollowCharacterCamera
        characterRef={characterRef}
        enableZoom={false}
        maxDistance={5.2}
        minDistance={3.2}
        offset={[0.85, 3.1, 4.25]}
        targetHeight={0.72}
      />
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
          characterRef={index === 0 ? characterRef : undefined}
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
    </>
  );
}

export function NeighborhoodScene({
  neighborhood,
  exteriorPresets,
  activeRoomSlot,
  invitedSlots,
  roomHouse,
  onAddFriendHouse,
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
            houseSlots={neighborhood.houseSlots}
            homeSlot={neighborhood.homeSlot}
            onAddFriendHouse={onAddFriendHouse}
            onEnterHome={onEnterHome}
          />
        )}
      </Canvas>
    </section>
  );
}
