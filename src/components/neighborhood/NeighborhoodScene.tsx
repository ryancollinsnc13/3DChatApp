import {
  ContactShadows,
  Float,
  Html,
  OrbitControls,
  Sparkles,
  useGLTF,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import {
  ACESFilmicToneMapping,
  Color,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  SRGBColorSpace,
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
  onSelectHouse: (ownerPlayerId: string) => void;
  onEnterHouse: (ownerPlayerId: string) => void;
  onExitRoom: () => void;
};

const positions: Record<number, [number, number, number]> = {
  0: [0, 0, 0],
  1: [-2.4, 0, -1.2],
  2: [2.4, 0, -1.1],
  3: [-1.4, 0, 1.8],
  4: [1.8, 0, 1.7],
  5: [0, 0, 3.1],
};

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
  walkRadius = 0.18,
  scale = 0.88,
}: {
  slot: HouseSlot;
  basePosition: [number, number, number];
  walkRadius?: number;
  scale?: number;
}) {
  const groupRef = useRef<Group>(null);
  const phase = useMemo(() => slot.slotIndex * 1.77 + slot.ownerPlayerId.length, [slot.ownerPlayerId.length, slot.slotIndex]);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }
    const t = clock.getElapsedTime() * 0.8 + phase;
    groupRef.current.position.x = basePosition[0] + Math.sin(t) * walkRadius;
    groupRef.current.position.y = basePosition[1] + Math.abs(Math.sin(t * 2)) * 0.035;
    groupRef.current.position.z = basePosition[2] + Math.cos(t * 0.82) * walkRadius;
    groupRef.current.rotation.y = Math.sin(t) * 0.45;
  });

  return (
    <group ref={groupRef}>
      <Suspense fallback={null}>
        <AvatarModel3D config={slot.avatarConfig} model={slot.avatarModel} scale={scale} walking />
      </Suspense>
      <Html center distanceFactor={8} position={[0, 1.34, 0]}>
        <span className="scene-character-label">{slot.displayName}</span>
      </Html>
    </group>
  );
}

function HouseMesh({
  slot,
  preset,
  onSelectHouse,
  onEnterHouse,
}: {
  slot: HouseSlot;
  preset: HousePreset;
  onSelectHouse: (ownerPlayerId: string) => void;
  onEnterHouse: (ownerPlayerId: string) => void;
}) {
  const position = positions[slot.slotIndex] ?? [slot.slotIndex - 2, 0, 2.8];

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelectHouse(slot.ownerPlayerId);
  };

  return (
    <group position={position} onClick={handleClick}>
      <Suspense fallback={null}>
        <GameHouseModel preset={preset} scale={1.08} />
      </Suspense>
      <mesh position={[0.55, 1.04, 0.15]} castShadow>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshPhysicalMaterial
          clearcoat={1}
          color={presenceColor(slot.presence)}
          emissive={presenceColor(slot.presence)}
          emissiveIntensity={0.42}
          roughness={0.2}
        />
      </mesh>
      <WalkingCharacter basePosition={[0.72, 0, -0.54]} slot={slot} walkRadius={0.08} scale={0.45} />
      <Html center distanceFactor={8} position={[0, 1.85, 0]}>
        <div className="scene-house-stack">
          <button
            className="scene-house-label"
            type="button"
            onClick={() => onSelectHouse(slot.ownerPlayerId)}
            data-testid={`scene-house-${slot.ownerPlayerId}`}
          >
            <span>{slot.displayName}</span>
            {slot.unreadCount > 0 ? <strong>{slot.unreadCount}</strong> : null}
          </button>
          <button
            className="scene-zoom-button"
            type="button"
            onClick={() => onEnterHouse(slot.ownerPlayerId)}
            data-testid={`enter-house-${slot.ownerPlayerId}`}
          >
            Zoom in
          </button>
        </div>
      </Html>
    </group>
  );
}

function NeighborhoodExterior({
  slots,
  exteriorPresets,
  onSelectHouse,
  onEnterHouse,
}: {
  slots: HouseSlot[];
  exteriorPresets: HousePreset[];
  onSelectHouse: (ownerPlayerId: string) => void;
  onEnterHouse: (ownerPlayerId: string) => void;
}) {
  return (
    <>
      <color attach="background" args={["#bde9ff"]} />
      <fog attach="fog" args={["#bde9ff", 16, 24]} />
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8, 7]} />
        <PremiumMaterial clearcoat={0.2} color="#8bd3a7" roughness={0.74} />
      </mesh>
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 1.74, 48]} />
        <PremiumMaterial clearcoat={0.32} color="#fff6cf" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[6.2, 0.22]} />
        <PremiumMaterial clearcoat={0.32} color="#fff6cf" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 4]}>
        <planeGeometry args={[6.2, 0.22]} />
        <PremiumMaterial clearcoat={0.32} color="#fff6cf" roughness={0.5} />
      </mesh>
      <Suspense fallback={null}>
        <Float floatIntensity={0.08} rotationIntensity={0.12} speed={1.2}>
          <RealModel name="toyCar" position={[-3.05, 0.08, 2.45]} rotation={[0, 0.7, 0]} scale={0.22} />
        </Float>
      </Suspense>
      <Sparkles color="#ffffff" count={24} noise={0.7} opacity={0.42} scale={[7, 1.2, 6]} size={2.2} speed={0.18} />
      {slots.map((slot) => (
        <HouseMesh
          key={slot.ownerPlayerId}
          onEnterHouse={onEnterHouse}
          onSelectHouse={onSelectHouse}
          preset={presetFor(slot, exteriorPresets)}
          slot={slot}
        />
      ))}
      <ContactShadows blur={3} opacity={0.34} position={[0, 0.01, 0]} scale={8} />
      <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2.25} minPolarAngle={Math.PI / 3.4} />
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
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
          scale={0.82}
          slot={slot}
          walkRadius={0.16}
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
  onSelectHouse,
  onEnterHouse,
  onExitRoom,
}: NeighborhoodSceneProps) {
  const slots = [neighborhood.homeSlot, ...neighborhood.houseSlots];

  return (
    <section className="scene-shell" aria-label={activeRoomSlot ? "House interior" : "Neighborhood map"}>
      <Canvas
        camera={{ position: activeRoomSlot ? [0, 3.1, 4.4] : [0, 4.8, 6.3], fov: activeRoomSlot ? 48 : 42 }}
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
            onEnterHouse={onEnterHouse}
            onSelectHouse={onSelectHouse}
            slots={slots}
          />
        )}
      </Canvas>
    </section>
  );
}
