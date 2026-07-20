import { ChangeEvent, FormEvent, useCallback, useState } from "react";
import { Box, CheckCircle2, RotateCcw, Save, UploadCloud } from "lucide-react";
import { starterAvatarModel } from "../../data/avatarModels";
import type { AvatarConfig, AvatarModel, Player } from "../../types/models";
import { AvatarStudioPreview } from "./AvatarStudioPreview";
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

function createUploadedModel(file: File): AvatarModel {
  const cleanName = file.name.replace(/\.(glb|gltf)$/i, "");

  return {
    modelId: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: cleanName || "Uploaded model",
    sourceUrl: URL.createObjectURL(file),
    sourceType: "upload",
    fileName: file.name,
    uploadedAt: new Date().toISOString(),
    scale: 1,
    yOffset: 0,
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
  const [error, setError] = useState<string | null>(null);

  const handleModelLoaded = useCallback((info: AvatarModelLoadInfo) => {
    setModelInfo(info);
  }, []);

  const handleModelError = useCallback((message: string) => {
    setModelInfo(null);
    setError(message);
  }, []);

  const updateModelFit = (update: Pick<AvatarModel, "scale"> | Pick<AvatarModel, "yOffset">) => {
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
    setModel(createUploadedModel(file));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSave(displayName, model, config);
  };

  const motionLabel = modelInfo?.animationCount
    ? `Rigged: ${modelInfo.walkAnimationName ?? "animation clip"}`
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
        name={displayName}
        onModelError={handleModelError}
        onModelLoaded={handleModelLoaded}
      />

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
          value={model.scale}
        />
        <ModelSlider
          label="Floor offset"
          max={1.2}
          min={-1.2}
          onChange={(value) => updateModelFit({ yOffset: value })}
          testId="avatar-offset-slider"
          value={model.yOffset}
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

function ModelSlider({
  label,
  max,
  min,
  onChange,
  testId,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  testId: string;
  value: number;
}) {
  return (
    <label className="avatar-slider">
      <span className="avatar-slider-label">
        <span>{label}</span>
        <strong>{value.toFixed(2)}</strong>
      </span>
      <input
        data-testid={testId}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={0.01}
        type="range"
        value={value}
      />
    </label>
  );
}
