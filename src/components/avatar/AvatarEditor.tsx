import { FormEvent, useMemo, useState } from "react";
import { Check, Glasses, Palette, Save, SlidersHorizontal, Smile, UserRound } from "lucide-react";
import type { AvatarConfig, AvatarPreset, Player } from "../../types/models";
import { AvatarStudioPreview } from "./AvatarStudioPreview";
import {
  blushColorOptions,
  eyeColorOptions,
  eyeStyleOptions,
  faceShapeOptions,
  hairColorOptions,
  hairStyleOptions,
  mouthStyleOptions,
  outfitColorOptions,
  skinToneOptions,
} from "./avatarOptions";

type AvatarEditorProps = {
  player: Player;
  presets: AvatarPreset[];
  isSaving: boolean;
  submitLabel: string;
  title: string;
  eyebrow: string;
  onSave: (avatarPresetId: string, displayName: string, config: AvatarConfig) => Promise<void>;
};

type EditorTab = "style" | "face" | "eyes" | "mouth" | "body";
type SwatchField = keyof Pick<
  AvatarConfig,
  "skinTone" | "hairColor" | "eyeColor" | "blushColor" | "outfitColor"
>;
type SliderField = keyof Pick<
  AvatarConfig,
  | "headSize"
  | "faceWidth"
  | "faceHeight"
  | "hairVolume"
  | "eyeSize"
  | "eyeSpacing"
  | "eyeHeight"
  | "mouthWidth"
  | "mouthHeight"
  | "bodyHeight"
  | "bodyWidth"
  | "glassesSize"
>;

const tabs: Array<{ id: EditorTab; label: string; icon: typeof UserRound }> = [
  { id: "style", label: "Style", icon: Palette },
  { id: "face", label: "Face", icon: UserRound },
  { id: "eyes", label: "Eyes", icon: SlidersHorizontal },
  { id: "mouth", label: "Mouth", icon: Smile },
  { id: "body", label: "Body", icon: SlidersHorizontal },
];

const swatchGroups: Array<{ field: SwatchField; label: string; options: string[] }> = [
  { field: "skinTone", label: "Skin", options: skinToneOptions },
  { field: "hairColor", label: "Hair", options: hairColorOptions },
  { field: "eyeColor", label: "Eyes", options: eyeColorOptions },
  { field: "blushColor", label: "Cheeks", options: blushColorOptions },
  { field: "outfitColor", label: "Outfit", options: outfitColorOptions },
];

const sliderDefaults: Record<SliderField, { label: string; min: number; max: number; step: number }> = {
  headSize: { label: "Head size", min: 0.82, max: 1.22, step: 0.01 },
  faceWidth: { label: "Face width", min: 0.78, max: 1.24, step: 0.01 },
  faceHeight: { label: "Face height", min: 0.82, max: 1.24, step: 0.01 },
  hairVolume: { label: "Hair volume", min: 0.65, max: 1.35, step: 0.01 },
  eyeSize: { label: "Eye size", min: 0.65, max: 1.45, step: 0.01 },
  eyeSpacing: { label: "Eye spacing", min: 0.72, max: 1.35, step: 0.01 },
  eyeHeight: { label: "Eye height", min: 0.78, max: 1.24, step: 0.01 },
  mouthWidth: { label: "Mouth width", min: 0.55, max: 1.55, step: 0.01 },
  mouthHeight: { label: "Mouth height", min: 0.78, max: 1.25, step: 0.01 },
  bodyHeight: { label: "Body height", min: 0.82, max: 1.24, step: 0.01 },
  bodyWidth: { label: "Body width", min: 0.78, max: 1.24, step: 0.01 },
  glassesSize: { label: "Glasses size", min: 0.75, max: 1.3, step: 0.01 },
};

export function AvatarEditor({
  player,
  presets,
  isSaving,
  submitLabel,
  title,
  eyebrow,
  onSave,
}: AvatarEditorProps) {
  const initialPresetId = player.avatarPresetId || presets[0]?.avatarPresetId || "custom";
  const [displayName, setDisplayName] = useState(player.displayName);
  const [selectedPresetId, setSelectedPresetId] = useState(initialPresetId);
  const [config, setConfig] = useState<AvatarConfig>(() => player.avatarConfig ?? presets[0].config);
  const [activeTab, setActiveTab] = useState<EditorTab>("style");

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.avatarPresetId === selectedPresetId),
    [presets, selectedPresetId],
  );

  const handlePresetClick = (preset: AvatarPreset) => {
    setSelectedPresetId(preset.avatarPresetId);
    setConfig(preset.config);
  };

  const updateConfig = <Field extends keyof AvatarConfig>(field: Field, value: AvatarConfig[Field]) => {
    setSelectedPresetId("custom");
    setConfig((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSave(selectedPresetId, displayName, config);
  };

  return (
    <form className="avatar-editor" onSubmit={handleSubmit}>
      <div className="avatar-editor-header">
        <div>
          <p className="text-sm font-black text-coral">{eyebrow}</p>
          <h2 className="text-2xl font-black">{title}</h2>
        </div>
      </div>

      <AvatarStudioPreview config={config} name={displayName} />

      <label className="block">
        <span className="text-sm font-bold text-ink/70">Name</span>
        <input
          className="mt-2 w-full rounded-md border-2 border-ink bg-white px-4 py-3 text-base font-black outline-none transition focus:border-tide focus:ring-4 focus:ring-tide/20"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          data-testid="avatar-name"
        />
      </label>

      <div className="avatar-tabs" role="tablist" aria-label="Avatar editor sections">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              aria-selected={activeTab === tab.id}
              className={`avatar-tab ${activeTab === tab.id ? "avatar-tab-active" : ""}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
              data-testid={`avatar-tab-${tab.id}`}
            >
              <Icon aria-hidden="true" size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="avatar-panel">
        {activeTab === "style" ? (
          <StylePanel
            config={config}
            presets={presets}
            selectedPresetId={selectedPresetId}
            onPresetClick={handlePresetClick}
            onUpdate={updateConfig}
          />
        ) : null}
        {activeTab === "face" ? (
          <FacePanel config={config} onUpdate={updateConfig} />
        ) : null}
        {activeTab === "eyes" ? (
          <EyesPanel config={config} onUpdate={updateConfig} />
        ) : null}
        {activeTab === "mouth" ? (
          <MouthPanel config={config} onUpdate={updateConfig} />
        ) : null}
        {activeTab === "body" ? (
          <BodyPanel config={config} onUpdate={updateConfig} />
        ) : null}
      </div>

      <button
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 font-black text-white transition hover:bg-tide disabled:cursor-not-allowed disabled:opacity-60"
        type="submit"
        disabled={isSaving}
        data-testid="avatar-submit"
      >
        <Save aria-hidden="true" size={18} />
        {isSaving ? "Saving" : submitLabel}
      </button>

      {selectedPreset ? <p className="mt-3 text-center text-xs font-bold text-ink/55">Based on {selectedPreset.name}</p> : null}
    </form>
  );
}

function StylePanel({
  config,
  presets,
  selectedPresetId,
  onPresetClick,
  onUpdate,
}: {
  config: AvatarConfig;
  presets: AvatarPreset[];
  selectedPresetId: string;
  onPresetClick: (preset: AvatarPreset) => void;
  onUpdate: <Field extends keyof AvatarConfig>(field: Field, value: AvatarConfig[Field]) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-ink/70">Starter looks</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {presets.map((preset) => {
            const isSelected = preset.avatarPresetId === selectedPresetId;
            return (
              <button
                className={`toy-choice ${isSelected ? "toy-choice-active" : ""}`}
                key={preset.avatarPresetId}
                type="button"
                onClick={() => onPresetClick(preset)}
                data-testid={`avatar-${preset.avatarPresetId}`}
              >
                <span
                  className="toy-choice-swatch"
                  style={{ backgroundColor: preset.swatch, color: preset.accent }}
                >
                  {isSelected ? <Check aria-hidden="true" size={16} /> : null}
                </span>
                <span>{preset.name}</span>
              </button>
            );
          })}
          {selectedPresetId === "custom" ? (
            <div className="toy-choice toy-choice-active">
              <span className="toy-choice-swatch" style={{ backgroundColor: config.outfitColor }}>
                <Check aria-hidden="true" size={16} />
              </span>
              <span>Custom</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="avatar-swatch-grid">
        {swatchGroups.map((group) => (
          <ColorSwatches
            key={group.field}
            label={group.label}
            options={group.options}
            value={config[group.field]}
            onChange={(value) => onUpdate(group.field, value)}
            testIdPrefix={`avatar-${group.field}`}
          />
        ))}
      </div>
    </div>
  );
}

function FacePanel({
  config,
  onUpdate,
}: {
  config: AvatarConfig;
  onUpdate: <Field extends keyof AvatarConfig>(field: Field, value: AvatarConfig[Field]) => void;
}) {
  return (
    <div className="space-y-4">
      <OptionGroup
        label="Face shape"
        options={faceShapeOptions}
        value={config.faceShape}
        onChange={(value) => onUpdate("faceShape", value)}
      />
      <SliderControl field="headSize" value={config.headSize} onChange={(value) => onUpdate("headSize", value)} />
      <SliderControl field="faceWidth" value={config.faceWidth} onChange={(value) => onUpdate("faceWidth", value)} />
      <SliderControl field="faceHeight" value={config.faceHeight} onChange={(value) => onUpdate("faceHeight", value)} />
      <OptionGroup
        label="Hair"
        options={hairStyleOptions}
        value={config.hairStyle}
        onChange={(value) => onUpdate("hairStyle", value)}
      />
      <SliderControl field="hairVolume" value={config.hairVolume} onChange={(value) => onUpdate("hairVolume", value)} />
    </div>
  );
}

function EyesPanel({
  config,
  onUpdate,
}: {
  config: AvatarConfig;
  onUpdate: <Field extends keyof AvatarConfig>(field: Field, value: AvatarConfig[Field]) => void;
}) {
  return (
    <div className="space-y-4">
      <OptionGroup
        label="Eye style"
        options={eyeStyleOptions}
        value={config.eyeStyle}
        onChange={(value) => onUpdate("eyeStyle", value)}
      />
      <SliderControl field="eyeSize" value={config.eyeSize} onChange={(value) => onUpdate("eyeSize", value)} />
      <SliderControl field="eyeSpacing" value={config.eyeSpacing} onChange={(value) => onUpdate("eyeSpacing", value)} />
      <SliderControl field="eyeHeight" value={config.eyeHeight} onChange={(value) => onUpdate("eyeHeight", value)} />
      <ColorSwatches
        label="Eye color"
        options={eyeColorOptions}
        value={config.eyeColor}
        onChange={(value) => onUpdate("eyeColor", value)}
        testIdPrefix="avatar-eyeColor"
      />
    </div>
  );
}

function MouthPanel({
  config,
  onUpdate,
}: {
  config: AvatarConfig;
  onUpdate: <Field extends keyof AvatarConfig>(field: Field, value: AvatarConfig[Field]) => void;
}) {
  return (
    <div className="space-y-4">
      <OptionGroup
        label="Mouth"
        options={mouthStyleOptions}
        value={config.mouthStyle}
        onChange={(value) => onUpdate("mouthStyle", value)}
      />
      <SliderControl field="mouthWidth" value={config.mouthWidth} onChange={(value) => onUpdate("mouthWidth", value)} />
      <SliderControl field="mouthHeight" value={config.mouthHeight} onChange={(value) => onUpdate("mouthHeight", value)} />
      <ColorSwatches
        label="Cheeks"
        options={blushColorOptions}
        value={config.blushColor}
        onChange={(value) => onUpdate("blushColor", value)}
        testIdPrefix="avatar-blushColor"
      />
    </div>
  );
}

function BodyPanel({
  config,
  onUpdate,
}: {
  config: AvatarConfig;
  onUpdate: <Field extends keyof AvatarConfig>(field: Field, value: AvatarConfig[Field]) => void;
}) {
  return (
    <div className="space-y-4">
      <SliderControl field="bodyHeight" value={config.bodyHeight} onChange={(value) => onUpdate("bodyHeight", value)} />
      <SliderControl field="bodyWidth" value={config.bodyWidth} onChange={(value) => onUpdate("bodyWidth", value)} />
      <div>
        <span className="text-sm font-bold text-ink/70">Glasses</span>
        <button
          className={`mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md border-2 px-3 text-sm font-black transition ${
            config.glasses ? "border-ink bg-ink text-white" : "border-ink bg-white text-ink"
          }`}
          type="button"
          onClick={() => onUpdate("glasses", !config.glasses)}
          data-testid="avatar-glasses"
        >
          <Glasses aria-hidden="true" size={17} />
          {config.glasses ? "On" : "Off"}
        </button>
      </div>
      <SliderControl field="glassesSize" value={config.glassesSize} onChange={(value) => onUpdate("glassesSize", value)} />
      <ColorSwatches
        label="Outfit"
        options={outfitColorOptions}
        value={config.outfitColor}
        onChange={(value) => onUpdate("outfitColor", value)}
        testIdPrefix="avatar-outfitColor"
      />
    </div>
  );
}

function OptionGroup<OptionValue extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ id: OptionValue; label: string }>;
  value: OptionValue;
  onChange: (value: OptionValue) => void;
}) {
  return (
    <div>
      <span className="text-sm font-bold text-ink/70">{label}</span>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            className={`rounded-md border-2 px-2 py-2 text-sm font-black transition ${
              value === option.id ? "border-ink bg-ink text-white" : "border-ink bg-white text-ink hover:bg-skytoy"
            }`}
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            data-testid={`avatar-${label.toLowerCase().split(" ")[0]}-${option.id}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SliderControl({
  field,
  value,
  onChange,
}: {
  field: SliderField;
  value: number;
  onChange: (value: number) => void;
}) {
  const meta = sliderDefaults[field];
  return (
    <label className="avatar-slider">
      <span className="avatar-slider-label">
        <span>{meta.label}</span>
        <strong>{value.toFixed(2)}</strong>
      </span>
      <input
        max={meta.max}
        min={meta.min}
        onChange={(event) => onChange(Number(event.target.value))}
        step={meta.step}
        type="range"
        value={value}
        data-testid={`avatar-slider-${field}`}
      />
    </label>
  );
}

function ColorSwatches({
  label,
  options,
  value,
  onChange,
  testIdPrefix,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  testIdPrefix: string;
}) {
  return (
    <div>
      <span className="text-sm font-bold text-ink/70">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            className={`h-8 w-8 rounded-md border-2 transition ${value === option ? "border-ink scale-105" : "border-white"}`}
            key={option}
            type="button"
            style={{ backgroundColor: option }}
            aria-label={`${label} ${option}`}
            onClick={() => onChange(option)}
            data-testid={`${testIdPrefix}-${option}`}
          />
        ))}
      </div>
    </div>
  );
}
