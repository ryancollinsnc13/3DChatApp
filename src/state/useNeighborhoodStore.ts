import { create } from "zustand";
import { friendsApi } from "../api/friends";
import { housesApi } from "../api/houses";
import type {
  DirectoryUser,
  FriendRequest,
  House,
  HouseSlot,
  Neighborhood,
} from "../types/models";

type NeighborhoodState = {
  neighborhood: Neighborhood | null;
  directory: DirectoryUser[];
  friendRequests: FriendRequest[];
  selectedHouse: House | null;
  selectedSlot: HouseSlot | null;
  isLoading: boolean;
  error: string | null;
  loadNeighborhood: () => Promise<void>;
  refreshNeighborhood: () => Promise<void>;
  selectHouse: (ownerPlayerId: string) => Promise<void>;
  clearSelectedHouse: () => void;
  requestFriend: (playerId: string) => Promise<void>;
  acceptFriend: (requestId: string) => Promise<void>;
  rejectFriend: (requestId: string) => Promise<void>;
  reset: () => void;
};

const initialState = {
  neighborhood: null,
  directory: [],
  friendRequests: [],
  selectedHouse: null,
  selectedSlot: null,
  isLoading: false,
  error: null,
};

function findSlot(neighborhood: Neighborhood | null, ownerPlayerId: string) {
  if (!neighborhood) {
    return null;
  }
  if (neighborhood.homeSlot.ownerPlayerId === ownerPlayerId) {
    return neighborhood.homeSlot;
  }
  return neighborhood.houseSlots.find((slot) => slot.ownerPlayerId === ownerPlayerId) ?? null;
}

export const useNeighborhoodStore = create<NeighborhoodState>((set) => ({
  ...initialState,
  async loadNeighborhood() {
    set({ isLoading: true, error: null });
    try {
      const [neighborhood, directory, friendRequests] = await Promise.all([
        housesApi.getNeighborhood(),
        friendsApi.getUsers(),
        friendsApi.getRequests(),
      ]);
      set({ neighborhood, directory, friendRequests, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to load neighborhood", isLoading: false });
    }
  },
  async refreshNeighborhood() {
    const neighborhood = await housesApi.getNeighborhood();
    set({ neighborhood });
  },
  async selectHouse(ownerPlayerId) {
    set({ isLoading: true, error: null });
    try {
      const [house, neighborhood] = await Promise.all([
        housesApi.visitHouse(ownerPlayerId),
        housesApi.getNeighborhood(),
      ]);
      set({
        selectedHouse: house,
        selectedSlot: findSlot(neighborhood, ownerPlayerId),
        neighborhood,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to visit house", isLoading: false });
    }
  },
  clearSelectedHouse() {
    set({ selectedHouse: null, selectedSlot: null });
  },
  async requestFriend(playerId) {
    const directory = await friendsApi.requestFriend(playerId);
    const friendRequests = await friendsApi.getRequests();
    set({ directory, friendRequests });
  },
  async acceptFriend(requestId) {
    const { requests, users, neighborhood } = await friendsApi.acceptFriend(requestId);
    set({ friendRequests: requests, directory: users, neighborhood });
  },
  async rejectFriend(requestId) {
    const friendRequests = await friendsApi.rejectFriend(requestId);
    set({ friendRequests });
  },
  reset() {
    set(initialState);
  },
}));
