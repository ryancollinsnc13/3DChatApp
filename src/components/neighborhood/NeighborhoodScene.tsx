import {
  ContactShadows,
  Html,
  OrbitControls,
  Sparkles,
  useFBX,
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
  PCFSoftShadowMap,
  SRGBColorSpace,
  Vector3,
} from "three";
import type { Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { House, HouseSlot, Neighborhood } from "../../types/models";
import { AvatarModel3D } from "../avatar/AvatarModel3D";

type NeighborhoodSceneProps = {
  neighborhood: Neighborhood;
  activeRoomSlot: HouseSlot | null;
  invitedSlots: HouseSlot[];
  roomHouse: House | null;
  onAddFriendHouse: () => void;
  onEnterHome: () => void;
  onExitRoom: () => void;
};

const modelPaths = {
  decorPlant: "/models/game/decor-plant.glb",
  furnitureKit: "/models/game/furniture-kit.glb",
  townCart: "/models/kenney-fantasy-town/Models/GLB%20format/cart.glb",
  townFence: "/models/kenney-fantasy-town/Models/GLB%20format/fence.glb",
  townFountain: "/models/kenney-fantasy-town/Models/GLB%20format/fountain-round-detail.glb",
  townLantern: "/models/kenney-fantasy-town/Models/GLB%20format/lantern.glb",
  townStallGreen: "/models/kenney-fantasy-town/Models/GLB%20format/stall-green.glb",
  townStallRed: "/models/kenney-fantasy-town/Models/GLB%20format/stall-red.glb",
  townTree: "/models/kenney-fantasy-town/Models/GLB%20format/tree-high-round.glb",
  townTower: "/models/kenney-retro-fantasy/Models/GLB%20format/tower.glb",
  townWallGate: "/models/kenney-retro-fantasy/Models/GLB%20format/wall-fortified-gate.glb",
  natureGround: "/models/kenney-nature-kit/Models/GLTF%20format/ground_grass.glb",
  naturePathCross: "/models/kenney-nature-kit/Models/GLTF%20format/ground_pathCross.glb",
  naturePathStraight: "/models/kenney-nature-kit/Models/GLTF%20format/ground_pathStraight.glb",
  naturePathTile: "/models/kenney-nature-kit/Models/GLTF%20format/ground_pathTile.glb",
  roomShell: "/models/game/room-shell.glb",
  avocado: "/models/Avocado.glb",
  corset: "/models/Corset.glb",
};

const medievalBuildingPaths = {
  blacksmith:
    "/models/quaternius-medieval-village/Medieval%20Village%20Pack%20-%20Dec%202020/Buildings/FBX/Blacksmith.fbx",
  house1:
    "/models/quaternius-medieval-village/Medieval%20Village%20Pack%20-%20Dec%202020/Buildings/FBX/House_1.fbx",
  house2:
    "/models/quaternius-medieval-village/Medieval%20Village%20Pack%20-%20Dec%202020/Buildings/FBX/House_2.fbx",
  house3:
    "/models/quaternius-medieval-village/Medieval%20Village%20Pack%20-%20Dec%202020/Buildings/FBX/House_3.fbx",
  house4:
    "/models/quaternius-medieval-village/Medieval%20Village%20Pack%20-%20Dec%202020/Buildings/FBX/House_4.fbx",
} as const;

type ModelName = keyof typeof modelPaths;
type MedievalBuildingName = keyof typeof medievalBuildingPaths;
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

function MedievalBuilding({
  name,
  position,
  rotation = 0,
  targetHeight = 2.65,
}: {
  name: MedievalBuildingName;
  position: ScenePosition;
  rotation?: number;
  targetHeight?: number;
}) {
  const fbx = useFBX(medievalBuildingPaths[name]);
  const scene = useMemo(() => {
    const normalizedScene = cloneAndTuneScene(fbx);
    const bounds = new Box3().setFromObject(normalizedScene);
    const size = bounds.getSize(new Vector3());
    normalizedScene.scale.setScalar(targetHeight / size.y);
    const scaledBounds = new Box3().setFromObject(normalizedScene);
    const center = scaledBounds.getCenter(new Vector3());
    normalizedScene.position.set(-center.x, -scaledBounds.min.y, -center.z);
    return normalizedScene;
  }, [fbx, targetHeight]);

  return <primitive object={scene} position={position} rotation={[0, rotation, 0]} />;
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

const housePlotPositions: ScenePosition[] = [
  [-4.8, 0, -2.25],
  [4.8, 0, -2.25],
  [-4.8, 0, 2.35],
  [4.8, 0, 2.35],
];

const houseModels: MedievalBuildingName[] = ["house2", "house3", "house4", "blacksmith"];

function TownGround() {
  const tilePositions: ScenePosition[] = [];
  for (let x = -10; x <= 10; x += 1) {
    for (let z = -4; z <= 4; z += 1) {
      tilePositions.push([x, -0.03, z]);
    }
  }

  return (
    <group>
      {tilePositions.map((position) => {
        const x = position[0];
        const z = position[2];
        const isVerticalPath = x === -6 || x === 0 || x === 6;
        const isHorizontalPath = z === 0;
        const isPlaza = Math.abs(x) <= 1 && z >= 1 && z <= 3;
        const name: ModelName =
          isPlaza
            ? "naturePathTile"
            : isVerticalPath && isHorizontalPath
              ? "naturePathCross"
              : isVerticalPath || isHorizontalPath
                ? "naturePathStraight"
                : "natureGround";
        const rotation: [number, number, number] =
          isHorizontalPath && !isVerticalPath ? [0, Math.PI / 2, 0] : [0, 0, 0];
        return (
          <RealModel
            key={`${x}-${z}`}
            name={name}
            position={position}
            rotation={rotation}
            scale={1.01}
          />
        );
      })}
    </group>
  );
}

function TownHousePlot({
  index,
  isHome = false,
  onAddHouse,
  onEnterHome,
  position,
  slot,
}: {
  index: number;
  isHome?: boolean;
  onAddHouse: () => void;
  onEnterHome: () => void;
  position: ScenePosition;
  slot?: HouseSlot;
}) {
  const handleHouseClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (isHome && event.delta <= 3) {
      onEnterHome();
    }
  };

  return (
    <group position={position}>
      {slot ? (
        <group onClick={handleHouseClick}>
          <MedievalBuilding
            name={isHome ? "house1" : houseModels[index % houseModels.length]}
            position={[0, 0, 0]}
            rotation={index % 2 === 0 ? 0.08 : -0.08}
            targetHeight={isHome ? 3 : 2.7}
          />
          <Html center distanceFactor={10} position={[0, 3.15, 0]}>
            <span className="scene-character-label">
              {isHome ? `${slot.displayName}'s house` : slot.displayName}
            </span>
          </Html>
        </group>
      ) : (
        <Html center distanceFactor={10} position={[0, 0.48, 0]}>
          <button
            aria-label="Add friend house"
            className="scene-add-friend-plot"
            onClick={onAddHouse}
            type="button"
          >
            <span>+</span>
            Place house
          </button>
        </Html>
      )}
    </group>
  );
}

function TownDecor() {
  const trees: Array<{ position: ScenePosition; scale: number }> = [
    { position: [-9.1, 0, -3.3], scale: 1.25 },
    { position: [-8.4, 0, 3.45], scale: 1.05 },
    { position: [8.7, 0, -3.4], scale: 1.15 },
    { position: [9.2, 0, 3.2], scale: 1.3 },
    { position: [-2.8, 0, 3.55], scale: 0.82 },
    { position: [2.9, 0, 3.55], scale: 0.86 },
  ];
  const fenceXs = [-7.2, -4.8, -2.4, 2.4, 4.8, 7.2];

  return (
    <group>
      {trees.map(({ position, scale }) => (
        <RealModel key={`tree-${position[0]}-${position[2]}`} name="townTree" position={position} scale={scale} />
      ))}
      {fenceXs.map((x) => (
        <RealModel key={`fence-${x}`} name="townFence" position={[x, 0, -4.35]} scale={1.2} />
      ))}
      <RealModel name="townFountain" position={[0, 0, 2.55]} scale={1.45} />
      <RealModel name="townStallRed" position={[-2.6, 0, -3.05]} rotation={[0, 0.18, 0]} scale={1.05} />
      <RealModel name="townStallGreen" position={[2.65, 0, -3.05]} rotation={[0, -0.18, 0]} scale={1.05} />
      <RealModel name="townCart" position={[7.9, 0, 0]} rotation={[0, -Math.PI / 2, 0]} scale={0.9} />
      <RealModel name="townLantern" position={[-1.35, 0, 0.15]} scale={1.2} />
      <RealModel name="townLantern" position={[1.35, 0, 0.15]} scale={1.2} />
      <RealModel name="townTower" position={[-9.1, 0, 0]} scale={1.35} />
      <RealModel name="townTower" position={[9.1, 0, 0]} scale={1.35} />
      <RealModel name="townWallGate" position={[0, 0, -4.2]} scale={1.15} />
    </group>
  );
}

function NeighborhoodExterior({
  houseSlots,
  homeSlot,
  onAddFriendHouse,
  onEnterHome,
}: {
  houseSlots: HouseSlot[];
  homeSlot: HouseSlot;
  onAddFriendHouse: () => void;
  onEnterHome: () => void;
}) {
  const characterRef = useRef<Group>(null);
  const [characterTarget, setCharacterTarget] = useState<ScenePosition | null>(null);

  const handleGroundClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 3) {
      return;
    }
    setCharacterTarget(constrainTarget([event.point.x, 0, event.point.z], exteriorMovementBounds, 0));
  }, []);

  return (
    <>
      <color attach="background" args={["#b9d8df"]} />
      <fog attach="fog" args={["#b9d8df", 18, 34]} />
      <FollowCharacterCamera
        characterRef={characterRef}
        enableZoom
        maxDistance={18}
        minDistance={4.5}
        offset={[0, 6.7, 8.8]}
        targetHeight={0.55}
      />
      <ambientLight intensity={0.72} />
      <hemisphereLight color="#fff1cf" groundColor="#66705a" intensity={1.2} />
      <directionalLight
        castShadow
        color="#ffe3b0"
        intensity={1.35}
        position={[6, 10, 7]}
        shadow-bias={-0.0002}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />
      <directionalLight color="#d9edff" intensity={0.5} position={[-6, 7, -5]} />
      <Suspense fallback={null}>
        <group onClick={handleGroundClick}>
          <TownGround />
        </group>
        <TownDecor />
        <TownHousePlot
          index={0}
          isHome
          onAddHouse={onAddFriendHouse}
          onEnterHome={onEnterHome}
          position={[0, 0, -1.65]}
          slot={homeSlot}
        />
        {housePlotPositions.map((position, index) => (
          <TownHousePlot
            index={index}
            key={`${position[0]}-${position[2]}`}
            onAddHouse={onAddFriendHouse}
            onEnterHome={onEnterHome}
            position={position}
            slot={houseSlots[index]}
          />
        ))}
      </Suspense>
      <WalkingCharacter
        basePosition={[0, 0, 0.65]}
        characterRef={characterRef}
        movementBounds={exteriorMovementBounds}
        scale={0.45}
        slot={homeSlot}
        targetPosition={characterTarget}
      />
      <ContactShadows blur={2.8} color="#473a2b" opacity={0.34} position={[0, 0.01, 0]} scale={22} />
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
          gl.shadowMap.type = PCFSoftShadowMap;
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
