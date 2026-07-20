import { ContactShadows, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, Suspense, useState } from "react";
import type { ReactNode } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import type { AvatarConfig, AvatarModel } from "../../types/models";
import { AvatarModel3D, type AvatarModelLoadInfo } from "./AvatarModel3D";

type AvatarStudioPreviewProps = {
  config: AvatarConfig;
  model?: AvatarModel | null;
  name: string;
  onModelLoaded?: (info: AvatarModelLoadInfo) => void;
  onModelError?: (message: string) => void;
};

type ModelErrorBoundaryProps = {
  children: ReactNode;
  onError?: (message: string) => void;
  resetKey: string;
};

type ModelErrorBoundaryState = {
  message: string | null;
};

class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  state: ModelErrorBoundaryState = { message: null };

  static getDerivedStateFromError(error: unknown) {
    return { message: error instanceof Error ? error.message : "Unable to load this model." };
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error instanceof Error ? error.message : "Unable to load this model.");
  }

  componentDidUpdate(previousProps: ModelErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.message) {
      this.setState({ message: null });
    }
  }

  render() {
    if (this.state.message) {
      return null;
    }

    return this.props.children;
  }
}

export function AvatarStudioPreview({
  config,
  model,
  name,
  onModelError,
  onModelLoaded,
}: AvatarStudioPreviewProps) {
  const modelKey = model?.sourceUrl ?? "starter-avatar";
  const [loadError, setLoadError] = useState<{ key: string; message: string } | null>(null);
  const visibleLoadError = loadError?.key === modelKey ? loadError.message : null;

  const handleModelError = (message: string) => {
    const displayMessage = "Could not read this model. Try a self-contained GLB export.";
    setLoadError({ key: modelKey, message: displayMessage });
    onModelError?.(`${displayMessage} ${message}`);
  };

  return (
    <div className="avatar-studio-card" data-testid="avatar-studio">
      <Canvas
        camera={{ position: [0, 1.25, 4.2], zoom: 145 }}
        dpr={[1.5, 2]}
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        orthographic
        data-testid="avatar-studio-canvas"
        onCreated={({ gl }) => {
          gl.toneMapping = ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.outputColorSpace = SRGBColorSpace;
          gl.shadowMap.enabled = true;
        }}
        shadows
      >
        <color attach="background" args={["#dff5ff"]} />
        <ambientLight intensity={0.72} />
        <hemisphereLight color="#ffffff" groundColor="#8bd3a7" intensity={1.1} />
        <directionalLight
          castShadow
          intensity={1.55}
          position={[2.8, 4.2, 3.2]}
          shadow-bias={-0.0002}
          shadow-mapSize-height={2048}
          shadow-mapSize-width={2048}
        />
        <pointLight color="#fff6cf" intensity={0.85} position={[-2, 2.2, 2.4]} />
        <ModelErrorBoundary onError={handleModelError} resetKey={modelKey}>
          <Suspense fallback={null}>
            <group key={modelKey} position={[0, -0.9, 0]} rotation={[0, 0.12, 0]}>
              <AvatarModel3D
                config={config}
                model={model}
                onModelLoaded={onModelLoaded}
                scale={1.26}
                walking
              />
            </group>
          </Suspense>
        </ModelErrorBoundary>
        <mesh position={[0, -0.77, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[1.1, 64]} />
          <meshStandardMaterial color="#fff6cf" roughness={0.62} />
        </mesh>
        <ContactShadows blur={1.1} opacity={0.32} position={[0, -0.74, 0]} scale={2.8} />
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.22}
          enablePan={false}
          enableZoom={false}
          maxPolarAngle={Math.PI / 2.08}
          minPolarAngle={Math.PI / 2.6}
        />
      </Canvas>
      {visibleLoadError ? (
        <div className="avatar-studio-error" data-testid="avatar-load-error">
          {visibleLoadError}
        </div>
      ) : null}
      <div className="avatar-studio-name">{name}</div>
    </div>
  );
}
