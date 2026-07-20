import { create } from "zustand";
import { authApi } from "../api/auth";
import { housesApi } from "../api/houses";
import type {
  AvatarConfig,
  AvatarModel,
  AvatarPreset,
  House,
  HousePreset,
  InteriorPreset,
  Player,
  ProfileUpdate,
} from "../types/models";

type SessionState = {
  player: Player | null;
  house: House | null;
  avatarPresets: AvatarPreset[];
  exteriorPresets: HousePreset[];
  interiorPresets: InteriorPreset[];
  isLoading: boolean;
  error: string | null;
  login: (displayName: string) => Promise<void>;
  setupAvatar: (
    avatarPresetId: string,
    displayName: string,
    avatarConfig: AvatarConfig,
    avatarModel: AvatarModel,
  ) => Promise<void>;
  updateProfile: (update: ProfileUpdate) => Promise<House>;
  logout: () => void;
  reset: () => void;
};

const initialState = {
  player: null,
  house: null,
  avatarPresets: [],
  exteriorPresets: [],
  interiorPresets: [],
  isLoading: false,
  error: null,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,
  async login(displayName) {
    set({ isLoading: true, error: null });
    try {
      const bootstrap = await authApi.login(displayName);
      set({
        player: bootstrap.player,
        house: bootstrap.house,
        avatarPresets: bootstrap.avatarPresets,
        exteriorPresets: bootstrap.exteriorPresets,
        interiorPresets: bootstrap.interiorPresets,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to log in", isLoading: false });
    }
  },
  async setupAvatar(avatarPresetId, displayName, avatarConfig, avatarModel) {
    set({ isLoading: true, error: null });
    try {
      const player = await authApi.saveAvatar(avatarPresetId, displayName, avatarConfig, avatarModel);
      set({ player, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to save avatar", isLoading: false });
    }
  },
  async updateProfile(update) {
    const previousHouse = get().house;
    const optimisticHouse = previousHouse ? { ...previousHouse, ...update } : null;
    if (optimisticHouse) {
      set({ house: optimisticHouse });
    }
    const house = await housesApi.updateHouse(update);
    set({ house });
    return house;
  },
  logout() {
    set(initialState);
  },
  reset() {
    set(initialState);
  },
}));
