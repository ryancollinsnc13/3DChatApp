import type { EyeStyle, FaceShape, HairStyle, MouthStyle } from "../../types/models";

export const faceShapeOptions: Array<{ id: FaceShape; label: string }> = [
  { id: "round", label: "Round" },
  { id: "soft_square", label: "Soft" },
  { id: "oval", label: "Oval" },
];

export const hairStyleOptions: Array<{ id: HairStyle; label: string }> = [
  { id: "bob", label: "Bob" },
  { id: "spiky", label: "Spiky" },
  { id: "swoop", label: "Swoop" },
  { id: "short", label: "Short" },
];

export const eyeStyleOptions: Array<{ id: EyeStyle; label: string }> = [
  { id: "dot", label: "Dot" },
  { id: "bright", label: "Bright" },
  { id: "sleepy", label: "Sleepy" },
];

export const mouthStyleOptions: Array<{ id: MouthStyle; label: string }> = [
  { id: "smile", label: "Smile" },
  { id: "grin", label: "Grin" },
  { id: "calm", label: "Calm" },
];

export const skinToneOptions = ["#f7d5bf", "#f1b891", "#d99a71", "#9b6a4c", "#7b5038"];
export const hairColorOptions = ["#2d231f", "#47352c", "#6a3e1f", "#1f3648", "#8c5238"];
export const eyeColorOptions = ["#2f2f38", "#284a6e", "#315f78", "#43315f", "#406c45"];
export const blushColorOptions = ["#f09a9d", "#ec8b8f", "#d9789d", "#f3a87c"];
export const outfitColorOptions = ["#48a96b", "#f4bf45", "#4f9fc8", "#ef756c", "#a783df"];
