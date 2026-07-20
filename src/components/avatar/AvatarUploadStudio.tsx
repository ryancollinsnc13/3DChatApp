import { ChangeEvent, FormEvent, useCallback, useState } from "react";
import { Box, CheckCircle2, RotateCcw, Save, UploadCloud } from "lucide-react";
import { starterAvatarModel } from "../../data/avatarModels";
import type { AvatarConfig, AvatarModel, Player } from "../../types/models";
import { AvatarStudioPreview } from "./AvatarStudioPreview";
import type { AvatarPreviewView } from "./AvatarStudioPreview";
import type { AvatarModelLoadInfo } from "./AvatarModel3D";

type AvatarUploadStudioProps = {
  eyebrow: string;
  isSaving: boolean;
  player: Player;
  submitLabel: string;
  title: string;
  onSave: (displayName: string, model: AvatarModel, config: AvatarConfig) => Promise<void>;
};

const maxUploadBytes = 128 * 1024 * 1024;
type PreviewMotionMode = "idle" | "walk";
const previewViews: AvatarPreviewView[] = ["front", "back", "top"];

function createUploadedModel(file: File): AvatarModel {
  const cleanName = file.name.replace(/\.(glb|gltf)$/i, "");

  return {
    modelId: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: cleanName || "Uploaded model",
    sourceUrl: URL.createObjectURL(file),
    sourceType: "upload",
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
    rotationY: 0,
    scale: 1,
    xOffset: 0,
    yOffset: 0,
    zOffset: 0,
  };
}

export function AvatarUploadStudio({
  eyebrow,
  isSaving,
  player,
  submitLabel,
  title,
  onSave,
}: AvatarUploadStudioProps) {
  const [displayName, setDisplayName] = useState(player.displayName);
  const [model, setModel] = useState<AvatarModel>(() => player.avatarModel ?? starterAvatarModel);
  const [config] = useState<AvatarConfig>(player.avatarConfig);
  const [modelInfo, setModelInfo] = useState<AvatarModelLoadInfo | null>(null);
  const [previewMotion, setPreviewMotion] = useState<PreviewMotionMode>("walk");
  const [previewView, setPreviewView] = useState<AvatarPreviewView>("front");
  const [error, setError] = useState<string | null>(null);

  const handleModelLoaded = useCallback((info: AvatarModelLoadInfo) => {
    setModelInfo(info);
    setModel((current) => {
      if (current.sourceType !== "upload" || info.animationNames.length === 0) {
        return current;
      }

      const idleAnimationName = current.idleAnimationName ?? info.idleAnimationName ?? info.animationNames[0];
      const walkAnimationName = current.walkAnimationName ?? info.walkAnimationName ?? info.animationNames[0];
      if (current.idleAnimationName === idleAnimationName && current.walkAnimationName === walkAnimationName) {
        return current;
      }

      return { ...current, idleAnimationName, walkAnimationName };
    });
  }, []);

  const handleModelError = useCallback((message: string) => {
    setModelInfo(null);
    setError(message);
  }, []);

  const updateModelFit = (
    update: Partial<Pick<AvatarModel, "rotationY" | "scale" | "xOffset" | "yOffset" | "zOffset">>,
  ) => {
    setModel((current) => ({ ...current, ...update }));
  };

  const updateAnimation = (update: Pick<AvatarModel, "idleAnimationName"> | Pick<AvatarModel, "walkAnimationName">) => {
    setModel((current) => ({ ...current, ...update }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const isSupported = /\.(glb|gltf)$/i.test(file.name);
    if (!isSupported) {
      setError("Choose a GLB or GLTF model.");
      return;
    }

    if (file.size > maxUploadBytes) {
      setError("Model must be 128 MB or smaller.");
      return;
    }

    setError(null);
    setModelInfo(null);
    setPreviewMotion("walk");
    setPreviewView("front");
    setModel(createUploadedModel(file));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSave(displayName, model, config);
  };

  const animationNames = modelInfo?.animationNames ?? [];
  const hasAnimations = animationNames.length > 0;
  const motionLabel = hasAnimations
    ? `${animationNames.length} clips available`
    : "Procedural walk";

  return (
    <form className="avatar-uploader" onSubmit={handleSubmit}>
      <div className="avatar-editor-header">
        <div>
          <p className="text-sm font-black text-coral">{eyebrow}</p>
          <h2 className="text-2xl font-black">{title}</h2>
        </div>
        <span className="avatar-model-status" data-testid="avatar-motion-status">
          <CheckCircle2 aria-hidden="true" size={16} />
          {motionLabel}
        </span>
      </div>

      <AvatarStudioPreview
        config={config}
        model={model}
        motionMode={previewMotion}
        name={displayName}
        onModelError={handleModelError}
        onModelLoaded={handleModelLoaded}
        viewMode={previewView}
      />

      <div className="avatar-motion-panel">
        <div>
          <span className="text-sm font-bold text-ink/70">Preview</span>
          <div className="avatar-motion-toggle" role="tablist" aria-label="Preview animation mode">
            <button
              aria-selected={previewMotion === "idle"}
              className={previewMotion === "idle" ? "avatar-motion-toggle-active" : ""}
              data-testid="avatar-preview-idle"
              onClick={() => setPreviewMotion("idle")}
              role="tab"
              type="button"
            >
              Idle
            </button>
            <button
              aria-selected={previewMotion === "walk"}
              className={previewMotion === "walk" ? "avatar-motion-toggle-active" : ""}
              data-testid="avatar-preview-walk"
              onClick={() => setPreviewMotion("walk")}
              role="tab"
              type="button"
            >
              Walk
            </button>
          </div>
        </div>

        <div>
          <span className="text-sm font-bold text-ink/70">View</span>
          <div className="avatar-view-toggle" role="tablist" aria-label="Preview camera view">
            {previewViews.map((view) => (
              <button
                aria-selected={previewView === view}
                className={previewView === view ? "avatar-motion-toggle-active" : ""}
                data-testid={`avatar-preview-view-${view}`}
                key={view}
                onClick={() => setPreviewView(view)}
                role="tab"
                type="button"
              >
                {view.slice(0, 1).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <AnimationSelect
          disabled={!hasAnimations}
          label="Idle animation"
          onChange={(idleAnimationName) => updateAnimation({ idleAnimationName })}
          options={animationNames}
          testId="avatar-idle-animation"
          value={model.idleAnimationName ?? modelInfo?.idleAnimationName ?? ""}
        />
        <AnimationSelect
          disabled={!hasAnimations}
          label="Walk animation"
          onChange={(walkAnimationName) => updateAnimation({ walkAnimationName })}
          options={animationNames}
          testId="avatar-walk-animation"
          value={model.walkAnimationName ?? modelInfo?.walkAnimationName ?? ""}
        />
      </div>

      <div className="avatar-upload-grid">
        <label className="avatar-file-drop">
          <input
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            className="sr-only"
            data-testid="avatar-model-file"
            onChange={handleFileChange}
            type="file"
          />
          <UploadCloud aria-hidden="true" size={24} />
          <span>Upload GLB/GLTF</span>
          <strong>{model.fileName ?? model.name}</strong>
        </label>

        <div className="avatar-model-card">
          <span>
            <Box aria-hidden="true" size={16} />
            Model
          </span>
          <strong data-testid="avatar-model-name">{model.name}</strong>
          {model.sourceType === "upload" ? (
            <button
              className="avatar-reset-model"
              data-testid="avatar-use-starter"
              onClick={() => {
                setModel(starterAvatarModel);
                setModelInfo(null);
                setPreviewMotion("walk");
                setPreviewView("front");
                setError(null);
              }}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={15} />
              Starter
            </button>
          ) : null}
        </div>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-bold text-ink/70">Name</span>
        <input
          className="mt-2 w-full rounded-md border-2 border-ink bg-white px-4 py-3 text-base font-black outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/20"
          data-testid="avatar-name"
          onChange={(event) => setDisplayName(event.target.value)}
          value={displayName}
        />
      </label>

      <div className="avatar-fit-panel">
        <ModelSlider
          label="Scale"
          max={1.8}
          min={0.08}
          onChange={(value) => updateModelFit({ scale: value })}
          testId="avatar-scale-slider"
          value={model.scale ?? 1}
        />
        <ModelSlider
          label="Floor offset"
          max={1.2}
          min={-1.2}
          onChange={(value) => updateModelFit({ yOffset: value })}
          testId="avatar-offset-slider"
          value={model.yOffset ?? 0}
        />
        <ModelSlider
          formatValue={(value) => `${Math.round(value)} deg`}
          label="Turn"
          max={180}
          min={-180}
          onChange={(value) => updateModelFit({ rotationY: value })}
          step={1}
          testId="avatar-rotation-slider"
          value={model.rotationY ?? 0}
        />
        <ModelSlider
          label="Center X"
          max={1}
          min={-1}
          onChange={(value) => updateModelFit({ xOffset: value })}
          testId="avatar-center-x-slider"
          value={model.xOffset ?? 0}
        />
        <ModelSlider
          label="Center Z"
          max={1}
          min={-1}
          onChange={(value) => updateModelFit({ zOffset: value })}
          testId="avatar-center-z-slider"
          value={model.zOffset ?? 0}
        />
      </div>

      {error ? <p className="mt-3 text-sm font-black text-coral">{error}</p> : null}

      <button
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 font-black text-white transition hover:bg-tide disabled:cursor-not-allowed disabled:opacity-60"
        data-testid="avatar-submit"
        disabled={isSaving}
        type="submit"
      >
        <Save aria-hidden="true" size={18} />
        {isSaving ? "Saving" : submitLabel}
      </button>
    </form>
  );
}

function AnimationSelect({
  disabled,
  label,
  onChange,
  options,
  testId,
  value,
}: {
  disabled: boolean;
  label: string;
  onChange: (value: string) => void;
  options: string[];
  testId: string;
  value: string;
}) {
  return (
    <label className="avatar-animation-select">
      <span>{label}</span>
      <select
        data-testid={testId}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {options.length > 0 ? (
          options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))
        ) : (
          <option value="">No GLB clips</option>
        )}
      </select>
    </label>
  );
}

function ModelSlider({
  formatValue = (value) => value.toFixed(2),
  label,
  max,
  min,
  onChange,
  step = 0.01,
  testId,
  value,
}: {
  formatValue?: (value: number) => string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  testId: string;
  value: number;
}) {
  return (
    <label className="avatar-slider">
      <span className="avatar-slider-label">
        <span>{label}</span>
        <strong>{formatValue(value)}</strong>
      </span>
      <input
        data-testid={testId}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={step}
        type="range"
        value={value}
      />
    </label>
  );
}
