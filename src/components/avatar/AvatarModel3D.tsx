import { useAnimations, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  Box3,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import type { Group } from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { characterModelPath } from "../../data/avatarModels";
import type { AvatarConfig, AvatarModel } from "../../types/models";

type AvatarModel3DProps = {
  config: AvatarConfig;
  model?: AvatarModel | null;
  walking?: boolean;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  onModelLoaded?: (info: AvatarModelLoadInfo) => void;
};

export type AvatarModelLoadInfo = {
  animationCount: number;
  sourceType: AvatarModel["sourceType"];
  walkAnimationName?: string;
};

const uploadedAvatarTargetHeight = 1.25;
const uploadedAvatarMaxHorizontalSpan = 1.1;

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
  const scene = cloneSkeleton(root);
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

function setVisibility(child: Mesh, visible: boolean) {
  child.visible = visible;
}

function multiplyScale(scale: AvatarModel3DProps["scale"], multiplier: number) {
  if (Array.isArray(scale)) {
    return scale.map((value) => value * multiplier) as [number, number, number];
  }
  return (scale ?? 1) * multiplier;
}

function positionWithYOffset(position: [number, number, number], yOffset: number) {
  return [position[0], position[1] + yOffset, position[2]] as [number, number, number];
}

function chooseWalkAnimationName(names: string[]) {
  const walkName = names.find((name) => {
    const normalized = name.toLowerCase();
    return ["walk", "run", "jog", "move", "locomotion"].some((keyword) => normalized.includes(keyword));
  });
  return walkName ?? names[0];
}

function getUploadedModelFit(root: Object3D) {
  root.updateWorldMatrix(true, true);

  const box = new Box3().setFromObject(root);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);

  const bounds = [box.min.x, box.min.y, box.min.z, box.max.x, box.max.y, box.max.z];
  if (bounds.some((value) => !Number.isFinite(value))) {
    return { offset: [0, 0, 0] as [number, number, number], scale: 1 };
  }

  const heightScale = size.y > 0 ? uploadedAvatarTargetHeight / size.y : 1;
  const widthScale = size.x > uploadedAvatarMaxHorizontalSpan ? uploadedAvatarMaxHorizontalSpan / size.x : heightScale;
  const depthScale = size.z > uploadedAvatarMaxHorizontalSpan ? uploadedAvatarMaxHorizontalSpan / size.z : heightScale;

  return {
    offset: [-center.x, -box.min.y, -center.z] as [number, number, number],
    scale: Math.min(heightScale, widthScale, depthScale),
  };
}

function applyProceduralWalk(root: Object3D, elapsed: number, walking: boolean) {
  const swing = walking ? Math.sin(elapsed * 5.6) : 0;
  const armSwing = swing * 0.34;
  const legSwing = swing * 0.24;

  root.traverse((child) => {
    if (!(child instanceof Mesh)) {
      return;
    }

    if (child.name.startsWith("ARM_SKIN") || child.name.startsWith("HAND_SKIN")) {
      const sign = child.name.includes("_L") ? 1 : -1;
      child.rotation.z = sign * armSwing;
    }

    if (child.name.startsWith("LEG_DARK") || child.name.startsWith("SHOE_DARK")) {
      const sign = child.name.includes("_L") ? -1 : 1;
      child.rotation.z = sign * legSwing;
    }
  });
}

function ConfigurableAvatarModel({
  config,
  model,
  walking = false,
  position,
  rotation,
  scale,
  onModelLoaded,
}: Required<Pick<AvatarModel3DProps, "config" | "position" | "rotation">> &
  Pick<AvatarModel3DProps, "model" | "walking" | "scale" | "onModelLoaded">) {
  const gltf = useGLTF(characterModelPath);
  const scene = useMemo(() => cloneAndTuneScene(gltf.scene), [gltf.scene]);
  const yOffset = model?.yOffset ?? 0;
  const modelScale = model?.scale ?? 1;

  useEffect(() => {
    applyMaterialColor(scene, (name) => name.includes("SKIN") || name.includes("NOSE"), config.skinTone);
    applyMaterialColor(scene, (name) => name.includes("HAIR"), config.hairColor);
    applyMaterialColor(scene, (name) => name.includes("OUTFIT") || name.includes("COLLAR"), config.outfitColor);
    applyMaterialColor(scene, (name) => name.includes("EYE") && !name.includes("HIGHLIGHT"), config.eyeColor);
    applyMaterialColor(scene, (name) => name.includes("BLUSH"), config.blushColor);

    scene.traverse((child) => {
      if (!(child instanceof Mesh)) {
        return;
      }

      if (child.name === "HEAD_SKIN") {
        child.scale.set(
          (config.faceShape === "oval" ? 0.86 : config.faceShape === "soft_square" ? 1.02 : 0.98) *
            config.headSize *
            config.faceWidth,
          (config.faceShape === "oval" ? 1.18 : config.faceShape === "soft_square" ? 0.98 : 1.05) *
            config.headSize *
            config.faceHeight,
          (config.faceShape === "soft_square" ? 0.82 : 0.86) * config.headSize,
        );
      }

      if (child.name === "FACE_NOSE") {
        child.position.y = 1.06 + (config.faceHeight - 1) * 0.08;
        child.scale.set(0.78 * config.headSize, 1, 0.62);
      }

      if (child.name === "HAIR_CAP") {
        setVisibility(child, config.hairStyle !== "spiky");
        const capHeight = config.hairStyle === "short" ? 0.9 : config.hairStyle === "spiky" ? 0.8 : 0.98;
        child.scale.set(1.02 * config.hairVolume, capHeight * config.hairVolume, 0.92 * config.hairVolume);
        child.position.y = 1.2 + (config.headSize - 1) * 0.12;
      }

      if (child.name === "HAIR_FRONT_BAND") {
        setVisibility(child, true);
        const width = config.hairStyle === "spiky" ? 1.36 : 1.18;
        const height = config.hairStyle === "spiky" ? 0.16 : 0.13;
        child.scale.set(width * config.hairVolume, height * config.hairVolume, 0.2 * config.hairVolume);
        child.position.y = 1.19 + (config.headSize - 1) * 0.1;
        child.position.z = -0.43;
      }

      if (child.name === "HAIR_BANG_SWEEP") {
        setVisibility(child, config.hairStyle === "swoop");
        child.scale.set(
          1.18 * config.hairVolume,
          0.3 * config.hairVolume,
          0.28 * config.hairVolume,
        );
      }

      if (child.name === "HAIR_BACK_VOLUME") {
        setVisibility(child, config.hairStyle === "bob" || config.hairStyle === "swoop");
        child.scale.setScalar((config.hairStyle === "bob" ? 1.18 : 0.92) * config.hairVolume);
      }

      if (child.name.startsWith("HAIR_BOB_SIDE")) {
        setVisibility(child, config.hairStyle === "bob");
        child.scale.set(0.64 * config.hairVolume, 1.38 * config.hairVolume, 0.52 * config.hairVolume);
      }

      if (child.name.startsWith("HAIR_SPIKE")) {
        setVisibility(child, config.hairStyle === "spiky");
        const spikeIndex = Number(child.name.split("_").at(-1) ?? 0);
        child.scale.setScalar((0.98 + (spikeIndex % 2) * 0.2) * config.hairVolume);
      }

      if (child.name === "HAIR_SWOOP_LOCK") {
        setVisibility(child, config.hairStyle === "swoop");
        child.scale.set(1.7 * config.hairVolume, 0.42 * config.hairVolume, 0.42 * config.hairVolume);
      }

      if (child.name === "HAIR_SHORT_FRINGE") {
        setVisibility(child, config.hairStyle === "short");
        child.scale.set(1.58 * config.hairVolume, 0.26 * config.hairVolume, 0.3 * config.hairVolume);
      }

      if (child.name === "FACE_MOUTH_SMILE") {
        const mouthCurve = config.mouthStyle === "calm" ? 0.22 : config.mouthStyle === "grin" ? 1.15 : 1;
        child.scale.set(
          (config.mouthStyle === "grin" ? 1.2 : config.mouthStyle === "calm" ? 0.75 : 1) * config.mouthWidth,
          mouthCurve,
          1,
        );
        child.position.y = 0.96 + (config.mouthHeight - 1) * -0.14;
      }

      if (child.name === "FACE_MOUTH_GRIN_FILL") {
        setVisibility(child, config.mouthStyle === "grin");
        child.scale.set(config.mouthWidth, 1, 1);
        child.position.y = 0.95 + (config.mouthHeight - 1) * -0.14;
      }

      if (child.name.startsWith("EYE_L") || child.name.startsWith("EYE_R")) {
        const sign = child.name.includes("_L") ? -1 : 1;
        const eyeYScale = config.eyeStyle === "sleepy" ? 0.34 : config.eyeStyle === "bright" ? 1.18 : 0.82;
        child.position.x = sign * 0.115 * config.eyeSpacing;
        child.position.y = 1.13 + (config.eyeHeight - 1) * 0.16;
        child.scale.set(0.92 * config.eyeSize, eyeYScale * config.eyeSize, 1);
      }

      if (child.name.startsWith("EYE_HIGHLIGHT_L") || child.name.startsWith("EYE_HIGHLIGHT_R")) {
        const sign = child.name.includes("_L") ? -1 : 1;
        setVisibility(child, config.eyeStyle === "bright");
        child.position.x = sign * 0.1 * config.eyeSpacing;
        child.position.y = 1.15 + (config.eyeHeight - 1) * 0.16;
        child.scale.setScalar(0.95 * config.eyeSize);
      }

      if (child.name.startsWith("BROW_L") || child.name.startsWith("BROW_R")) {
        const sign = child.name.includes("_L") ? -1 : 1;
        child.position.x = sign * 0.115 * config.eyeSpacing;
        child.position.y = 1.235 + (config.eyeHeight - 1) * 0.16;
        child.rotation.z = sign * (config.eyeStyle === "sleepy" ? -0.18 : 0.08);
        child.scale.set(config.eyeSize, 1, 1);
      }

      if (child.name.startsWith("BLUSH_L") || child.name.startsWith("BLUSH_R")) {
        const sign = child.name.includes("_L") ? -1 : 1;
        child.position.x = sign * 0.19 * config.eyeSpacing;
        child.position.y = 1.035 + (config.eyeHeight - 1) * 0.1;
      }

      if (child.name.includes("GLASSES")) {
        setVisibility(child, config.glasses);
        const sign = child.name.includes("_L") ? -1 : child.name.includes("_R") ? 1 : 0;
        child.position.x = sign ? sign * 0.112 * config.eyeSpacing : 0;
        child.position.y = 1.14 + (config.eyeHeight - 1) * 0.16;
        child.scale.setScalar(config.glassesSize);
      }

      if (child.name === "BODY_OUTFIT") {
        child.scale.set(config.bodyWidth, config.bodyHeight, 0.72);
      }

      if (child.name === "BODY_COLLAR") {
        child.scale.set(config.bodyWidth, 0.55, 1);
        child.position.y = 0.63 * config.bodyHeight;
      }

      if (child.name.startsWith("ARM_SKIN")) {
        const sign = child.name.includes("_L") ? -1 : 1;
        child.position.x = sign * 0.21 * config.bodyWidth;
        child.position.y = 0.4 * config.bodyHeight;
      }

      if (child.name.startsWith("HAND_SKIN")) {
        const sign = child.name.includes("_L") ? -1 : 1;
        child.position.x = sign * 0.29 * config.bodyWidth;
        child.position.y = 0.24 * config.bodyHeight;
      }

      if (child.name.startsWith("LEG_DARK")) {
        const sign = child.name.includes("_L") ? -1 : 1;
        child.position.x = sign * 0.065 * config.bodyWidth;
      }

      if (child.name.startsWith("SHOE_DARK")) {
        const sign = child.name.includes("_L") ? -1 : 1;
        child.position.x = sign * 0.074 * config.bodyWidth;
      }
    });
  }, [config, scene]);

  useEffect(() => {
    onModelLoaded?.({ animationCount: 0, sourceType: "starter" });
  }, [onModelLoaded]);

  useFrame(({ clock }) => {
    applyProceduralWalk(scene, clock.getElapsedTime(), walking);
  });

  return (
    <primitive
      object={scene}
      position={positionWithYOffset(position, yOffset)}
      rotation={rotation}
      scale={multiplyScale(scale, modelScale)}
    />
  );
}

function UploadedAvatarModel({
  model,
  walking = false,
  position,
  rotation,
  scale,
  onModelLoaded,
}: {
  model: AvatarModel;
  walking?: boolean;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: number | [number, number, number];
  onModelLoaded?: (info: AvatarModelLoadInfo) => void;
}) {
  const groupRef = useRef<Group>(null);
  const gltf = useGLTF(model.sourceUrl);
  const scene = useMemo(() => cloneAndTuneScene(gltf.scene), [gltf.scene]);
  const fit = useMemo(() => getUploadedModelFit(scene), [scene]);
  const { actions, names } = useAnimations(gltf.animations, groupRef);
  const animationName = useMemo(() => chooseWalkAnimationName(names), [names]);
  const basePosition = positionWithYOffset(position, model.yOffset);

  useEffect(() => {
    tuneModelMaterials(scene);
  }, [scene]);

  useEffect(() => {
    onModelLoaded?.({
      animationCount: names.length,
      sourceType: model.sourceType,
      walkAnimationName: animationName,
    });
  }, [animationName, model.sourceType, names.length, onModelLoaded]);

  useEffect(() => {
    const action = animationName ? actions[animationName] : null;
    if (!walking || !action) {
      return;
    }

    action.reset().fadeIn(0.16).play();
    return () => {
      action.fadeOut(0.16);
    };
  }, [actions, animationName, walking]);

  useFrame(({ clock }) => {
    if (!groupRef.current) {
      return;
    }

    if (!walking || animationName) {
      groupRef.current.position.y = basePosition[1];
      return;
    }

    const elapsed = clock.getElapsedTime();
    groupRef.current.position.y = basePosition[1] + Math.abs(Math.sin(elapsed * 5.2)) * 0.035;
    groupRef.current.rotation.z = Math.sin(elapsed * 4.6) * 0.025;
  });

  return (
    <group
      ref={groupRef}
      position={basePosition}
      rotation={rotation}
      scale={multiplyScale(scale, model.scale)}
    >
      <group scale={fit.scale}>
        <primitive object={scene} position={fit.offset} />
      </group>
    </group>
  );
}

export function AvatarModel3D({
  config,
  model,
  walking = false,
  position = [0, 0, 0],
  rotation = [0, Math.PI, 0],
  scale = 1,
  onModelLoaded,
}: AvatarModel3DProps) {
  if (model?.sourceType === "upload") {
    return (
      <UploadedAvatarModel
        model={model}
        onModelLoaded={onModelLoaded}
        position={position}
        rotation={rotation}
        scale={scale}
        walking={walking}
      />
    );
  }

  return (
    <ConfigurableAvatarModel
      config={config}
      model={model}
      onModelLoaded={onModelLoaded}
      position={position}
      rotation={rotation}
      scale={scale}
      walking={walking}
    />
  );
}

useGLTF.preload(characterModelPath);
