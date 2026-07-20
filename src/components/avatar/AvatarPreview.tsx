import type { CSSProperties } from "react";
import type { AvatarConfig } from "../../types/models";

type AvatarPreviewProps = {
  config: AvatarConfig;
  name?: string;
  size?: "sm" | "lg";
};

export function AvatarPreview({ config, name, size = "lg" }: AvatarPreviewProps) {
  const bodyStyle: CSSProperties = {
    backgroundColor: config.outfitColor,
    transform: `translateX(-50%) scale(${config.bodyWidth}, ${config.bodyHeight})`,
  };
  const faceStyle: CSSProperties = {
    backgroundColor: config.skinTone,
    transform: `translateX(-50%) scale(${config.headSize * config.faceWidth}, ${config.headSize * config.faceHeight})`,
  };
  const hairStyle: CSSProperties = {
    backgroundColor: config.hairColor,
    transform: `scale(${config.hairVolume})`,
  };
  const leftEyeStyle: CSSProperties = {
    backgroundColor: config.eyeColor,
    height: `${0.62 * config.eyeSize}rem`,
    left: `${50 - 18 * config.eyeSpacing}%`,
    top: `${45 * config.eyeHeight}%`,
    width: `${0.62 * config.eyeSize}rem`,
  };
  const rightEyeStyle: CSSProperties = {
    backgroundColor: config.eyeColor,
    height: `${0.62 * config.eyeSize}rem`,
    right: `${50 - 18 * config.eyeSpacing}%`,
    top: `${45 * config.eyeHeight}%`,
    width: `${0.62 * config.eyeSize}rem`,
  };
  const mouthStyle: CSSProperties = {
    top: `${67 * config.mouthHeight}%`,
    width: `${1.2 * config.mouthWidth}rem`,
  };
  const glassesStyle: CSSProperties = {
    top: `${43 * config.eyeHeight}%`,
    transform: `scale(${config.glassesSize})`,
  };

  return (
    <div className={`avatar-preview avatar-preview-${size}`} data-testid="avatar-preview">
      <div className="avatar-stage">
        <div className="avatar-shadow" />
        <div className="avatar-body" style={bodyStyle} />
        <div
          className={`avatar-face avatar-face-${config.faceShape}`}
          style={faceStyle}
        >
          <div
            className={`avatar-hair avatar-hair-${config.hairStyle}`}
            style={hairStyle}
          />
          <div className="avatar-blush avatar-blush-left" style={{ backgroundColor: config.blushColor }} />
          <div className="avatar-blush avatar-blush-right" style={{ backgroundColor: config.blushColor }} />
          <div className={`avatar-eye avatar-eye-left avatar-eye-${config.eyeStyle}`} style={leftEyeStyle} />
          <div className={`avatar-eye avatar-eye-right avatar-eye-${config.eyeStyle}`} style={rightEyeStyle} />
          {config.glasses ? <div className="avatar-glasses" style={glassesStyle} /> : null}
          <div className={`avatar-mouth avatar-mouth-${config.mouthStyle}`} style={mouthStyle} />
        </div>
      </div>
      {name ? <p className="avatar-name">{name}</p> : null}
    </div>
  );
}
