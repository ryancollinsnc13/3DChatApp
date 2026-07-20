import type {
  AvatarConfig,
  AvatarPreset,
  Conversation,
  DirectoryUser,
  FriendRequest,
  House,
  HousePreset,
  InteriorPreset,
  Message,
  Neighborhood,
  Player,
} from "../types/models";
import { starterAvatarModel } from "./avatarModels";

export type MockDatabase = {
  activePlayerId: string;
  players: Record<string, Player>;
  houses: Record<string, House>;
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  neighborhood: Neighborhood;
  directory: DirectoryUser[];
  friendRequests: FriendRequest[];
  avatarPresets: AvatarPreset[];
  exteriorPresets: HousePreset[];
  interiorPresets: InteriorPreset[];
};

const avatarConfigs: Record<string, AvatarConfig> = {
  sprout: {
    faceShape: "round",
    headSize: 1,
    faceWidth: 1,
    faceHeight: 1,
    skinTone: "#f5c7a9",
    hairStyle: "bob",
    hairColor: "#47352c",
    hairVolume: 1,
    eyeStyle: "bright",
    eyeColor: "#284a6e",
    eyeSize: 1,
    eyeSpacing: 1,
    eyeHeight: 1,
    mouthStyle: "smile",
    mouthWidth: 1,
    mouthHeight: 1,
    blushColor: "#f09a9d",
    outfitColor: "#48a96b",
    bodyHeight: 1,
    bodyWidth: 1,
    glasses: false,
    glassesSize: 1,
  },
  sunbeam: {
    faceShape: "soft_square",
    headSize: 0.96,
    faceWidth: 1.08,
    faceHeight: 0.94,
    skinTone: "#d99a71",
    hairStyle: "spiky",
    hairColor: "#6a3e1f",
    hairVolume: 1.18,
    eyeStyle: "dot",
    eyeColor: "#2f2f38",
    eyeSize: 0.92,
    eyeSpacing: 1.12,
    eyeHeight: 0.92,
    mouthStyle: "grin",
    mouthWidth: 1.16,
    mouthHeight: 0.92,
    blushColor: "#ec8b8f",
    outfitColor: "#f4bf45",
    bodyHeight: 1.04,
    bodyWidth: 1.05,
    glasses: false,
    glassesSize: 1,
  },
  tide: {
    faceShape: "oval",
    headSize: 1.02,
    faceWidth: 0.88,
    faceHeight: 1.16,
    skinTone: "#f1b891",
    hairStyle: "swoop",
    hairColor: "#1f3648",
    hairVolume: 1.05,
    eyeStyle: "sleepy",
    eyeColor: "#315f78",
    eyeSize: 0.88,
    eyeSpacing: 0.95,
    eyeHeight: 1.08,
    mouthStyle: "calm",
    mouthWidth: 0.82,
    mouthHeight: 1.1,
    blushColor: "#ea8f96",
    outfitColor: "#4f9fc8",
    bodyHeight: 1.08,
    bodyWidth: 0.92,
    glasses: true,
    glassesSize: 1.06,
  },
  lilac: {
    faceShape: "round",
    headSize: 1.04,
    faceWidth: 1.02,
    faceHeight: 0.98,
    skinTone: "#7b5038",
    hairStyle: "short",
    hairColor: "#2d231f",
    hairVolume: 0.82,
    eyeStyle: "bright",
    eyeColor: "#43315f",
    eyeSize: 1.08,
    eyeSpacing: 0.9,
    eyeHeight: 0.98,
    mouthStyle: "smile",
    mouthWidth: 0.92,
    mouthHeight: 1,
    blushColor: "#d9789d",
    outfitColor: "#a783df",
    bodyHeight: 0.96,
    bodyWidth: 1.02,
    glasses: false,
    glassesSize: 1,
  },
};

const avatarPresets: AvatarPreset[] = [
  { avatarPresetId: "sprout", name: "Sprout", swatch: "#8bd3a7", accent: "#2f7a5f", config: avatarConfigs.sprout },
  { avatarPresetId: "sunbeam", name: "Sunbeam", swatch: "#f7c857", accent: "#9c5f1d", config: avatarConfigs.sunbeam },
  { avatarPresetId: "tide", name: "Tide", swatch: "#72a9c9", accent: "#245b7b", config: avatarConfigs.tide },
  { avatarPresetId: "lilac", name: "Lilac", swatch: "#b69be8", accent: "#6247aa", config: avatarConfigs.lilac },
];

const exteriorPresets: HousePreset[] = [
  { presetId: "moss-cottage", name: "Moss Cottage", roofColor: "#4f7b58", wallColor: "#f7e7c8", trimColor: "#2f5d50" },
  { presetId: "coral-porch", name: "Coral Porch", roofColor: "#ec6f66", wallColor: "#ffe3d5", trimColor: "#8e3e38" },
  { presetId: "tide-studio", name: "Tide Studio", roofColor: "#4b83a7", wallColor: "#d9eef2", trimColor: "#2d5671" },
  { presetId: "honey-loft", name: "Honey Loft", roofColor: "#f2b84b", wallColor: "#fff2c2", trimColor: "#875f18" },
];

const interiorPresets: InteriorPreset[] = [
  { presetId: "tea-room", name: "Tea Room", mood: "quiet", color: "#d8efe0" },
  { presetId: "record-nook", name: "Record Nook", mood: "warm", color: "#ffd8c2" },
  { presetId: "window-desk", name: "Window Desk", mood: "focused", color: "#d9eef2" },
  { presetId: "lantern-den", name: "Lantern Den", mood: "cozy", color: "#ffe7a3" },
];

const players: Record<string, Player> = {
  p1: {
    playerId: "p1",
    username: "ryan",
    displayName: "Ryan",
    avatarPresetId: "",
    avatarConfig: avatarConfigs.sprout,
    avatarModel: null,
    presence: "online",
  },
  p2: {
    playerId: "p2",
    username: "mara",
    displayName: "Mara",
    avatarPresetId: "sprout",
    avatarConfig: avatarConfigs.sprout,
    avatarModel: starterAvatarModel,
    presence: "online",
  },
  p3: {
    playerId: "p3",
    username: "jun",
    displayName: "Jun",
    avatarPresetId: "tide",
    avatarConfig: avatarConfigs.tide,
    avatarModel: starterAvatarModel,
    presence: "away",
  },
  p4: {
    playerId: "p4",
    username: "sol",
    displayName: "Sol",
    avatarPresetId: "sunbeam",
    avatarConfig: avatarConfigs.sunbeam,
    avatarModel: starterAvatarModel,
    presence: "offline",
  },
  p5: {
    playerId: "p5",
    username: "nora",
    displayName: "Nora",
    avatarPresetId: "lilac",
    avatarConfig: avatarConfigs.lilac,
    avatarModel: starterAvatarModel,
    presence: "online",
  },
  p6: {
    playerId: "p6",
    username: "dev",
    displayName: "Dev",
    avatarPresetId: "tide",
    avatarConfig: avatarConfigs.tide,
    avatarModel: starterAvatarModel,
    presence: "away",
  },
};

const houses: Record<string, House> = {
  p1: {
    houseId: "h1",
    ownerPlayerId: "p1",
    name: "Ryan's Porch",
    exteriorPreset: "moss-cottage",
    interiorPreset: "tea-room",
    privacy: "friends_only",
    status: "Around and tinkering",
    bio: "Building a calm corner for quick chats, updates, and neighbor visits.",
    updatedAt: "2026-06-24T19:30:00.000Z",
  },
  p2: {
    houseId: "h2",
    ownerPlayerId: "p2",
    name: "Mara's Greenhouse",
    exteriorPreset: "moss-cottage",
    interiorPreset: "window-desk",
    privacy: "public",
    status: "Coffee and voice notes",
    bio: "Usually around for design feedback and neighbor gossip.",
    updatedAt: "2026-06-24T18:12:00.000Z",
  },
  p3: {
    houseId: "h3",
    ownerPlayerId: "p3",
    name: "Jun's Blue Room",
    exteriorPreset: "tide-studio",
    interiorPreset: "record-nook",
    privacy: "friends_only",
    status: "Away for dinner",
    bio: "DM me ideas and I will answer when I am back.",
    updatedAt: "2026-06-24T17:05:00.000Z",
  },
  p4: {
    houseId: "h4",
    ownerPlayerId: "p4",
    name: "Sol's Lantern",
    exteriorPreset: "honey-loft",
    interiorPreset: "lantern-den",
    privacy: "public",
    status: "Catching up later",
    bio: "Group chat archivist and occasional playlist maker.",
    updatedAt: "2026-06-24T14:40:00.000Z",
  },
  p5: {
    houseId: "h5",
    ownerPlayerId: "p5",
    name: "Nora's Coral Flat",
    exteriorPreset: "coral-porch",
    interiorPreset: "tea-room",
    privacy: "public",
    status: "Open to new neighbors",
    bio: "Likes short messages, good links, and calmer feeds.",
    updatedAt: "2026-06-24T15:22:00.000Z",
  },
  p6: {
    houseId: "h6",
    ownerPlayerId: "p6",
    name: "Dev's Draft House",
    exteriorPreset: "tide-studio",
    interiorPreset: "window-desk",
    privacy: "public",
    status: "Reviewing the mock API",
    bio: "A seeded user for testing friend flows.",
    updatedAt: "2026-06-24T16:00:00.000Z",
  },
};

const conversations: Conversation[] = [];

const messages: Record<string, Message[]> = {};

const neighborhood: Neighborhood = {
  neighborhoodId: "n1",
  ownerPlayerId: "p1",
  theme: "dusk-garden",
  homeSlot: {
    slotIndex: 0,
    ownerPlayerId: "p1",
    displayName: "Ryan",
    relationship: "self",
    presence: "online",
    exteriorPreset: "moss-cottage",
    avatarConfig: avatarConfigs.sprout,
    avatarModel: null,
    unreadCount: 0,
    lastActivity: "2026-06-24T19:30:00.000Z",
  },
  houseSlots: [],
};

const directory: DirectoryUser[] = [];

const friendRequests: FriendRequest[] = [];

export function createMockDatabase(): MockDatabase {
  return structuredClone({
    activePlayerId: "p1",
    players,
    houses,
    conversations,
    messages,
    neighborhood,
    directory,
    friendRequests,
    avatarPresets,
    exteriorPresets,
    interiorPresets,
  });
}
