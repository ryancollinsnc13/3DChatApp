import type { AvatarModel } from "../types/models";

export const characterModelPath = "/models/game/character-base.glb";

export const starterAvatarModel: AvatarModel = {
  modelId: "starter-character",
  name: "Starter Walker",
  sourceUrl: characterModelPath,
  sourceType: "starter",
  fileName: "character-base.glb",
  uploadedAt: "2026-06-24T00:00:00.000Z",
  scale: 1,
  yOffset: 0,
};
