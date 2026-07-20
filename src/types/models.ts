export type Presence = "online" | "away" | "offline";
export type Privacy = "public" | "friends_only" | "private";
export type ConversationType = "dm" | "group";
export type Relationship = "self" | "friend";
export type FriendRequestStatus = "incoming" | "outgoing" | "accepted" | "rejected";
export type FaceShape = "round" | "soft_square" | "oval";
export type HairStyle = "bob" | "spiky" | "swoop" | "short";
export type EyeStyle = "dot" | "bright" | "sleepy";
export type MouthStyle = "smile" | "grin" | "calm";

export type AvatarModelSource = "starter" | "upload";

export type AvatarModel = {
  modelId: string;
  name: string;
  sourceUrl: string;
  sourceType: AvatarModelSource;
  fileName?: string;
  uploadedAt: string;
  scale: number;
  yOffset: number;
};

export type AvatarConfig = {
  faceShape: FaceShape;
  headSize: number;
  faceWidth: number;
  faceHeight: number;
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  hairVolume: number;
  eyeStyle: EyeStyle;
  eyeColor: string;
  eyeSize: number;
  eyeSpacing: number;
  eyeHeight: number;
  mouthStyle: MouthStyle;
  mouthWidth: number;
  mouthHeight: number;
  blushColor: string;
  outfitColor: string;
  bodyHeight: number;
  bodyWidth: number;
  glasses: boolean;
  glassesSize: number;
};

export type Player = {
  playerId: string;
  username: string;
  displayName: string;
  avatarPresetId: string;
  avatarConfig: AvatarConfig;
  avatarModel: AvatarModel | null;
  level?: number;
  presence: Presence;
};

export type House = {
  houseId: string;
  ownerPlayerId: string;
  name: string;
  exteriorPreset: string;
  interiorPreset: string;
  privacy: Privacy;
  status: string;
  bio: string;
  updatedAt: string;
};

export type Conversation = {
  conversationId: string;
  conversationType: ConversationType;
  title: string;
  participantIds: string[];
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
};

export type Message = {
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export type Neighborhood = {
  neighborhoodId: string;
  ownerPlayerId: string;
  theme: string;
  homeSlot: HouseSlot;
  houseSlots: HouseSlot[];
};

export type HouseSlot = {
  slotIndex: number;
  ownerPlayerId: string;
  displayName: string;
  relationship: Relationship;
  presence: Presence;
  exteriorPreset: string;
  avatarConfig: AvatarConfig;
  avatarModel: AvatarModel | null;
  unreadCount: number;
  lastActivity?: string;
};

export type FriendRequest = {
  requestId: string;
  fromPlayerId: string;
  toPlayerId: string;
  status: FriendRequestStatus;
  createdAt: string;
};

export type DirectoryUser = {
  playerId: string;
  username: string;
  displayName: string;
  presence: Presence;
  avatarPresetId: string;
  avatarConfig: AvatarConfig;
  avatarModel: AvatarModel | null;
  relationship: "friend" | "none" | "requested";
};

export type AvatarPreset = {
  avatarPresetId: string;
  name: string;
  swatch: string;
  accent: string;
  config: AvatarConfig;
};

export type HousePreset = {
  presetId: string;
  name: string;
  roofColor: string;
  wallColor: string;
  trimColor: string;
};

export type InteriorPreset = {
  presetId: string;
  name: string;
  mood: string;
  color: string;
};

export type SessionBootstrap = {
  player: Player;
  house: House;
  avatarPresets: AvatarPreset[];
  exteriorPresets: HousePreset[];
  interiorPresets: InteriorPreset[];
};

export type ProfileUpdate = Partial<
  Pick<House, "name" | "status" | "bio" | "privacy" | "exteriorPreset" | "interiorPreset">
>;
