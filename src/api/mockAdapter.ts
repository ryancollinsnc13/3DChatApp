import { createMockDatabase } from "../data/seed";
import type {
  AvatarConfig,
  AvatarModel,
  Conversation,
  DirectoryUser,
  FriendRequest,
  House,
  HouseSlot,
  Message,
  Neighborhood,
  Player,
  ProfileUpdate,
  SessionBootstrap,
} from "../types/models";

let db = createMockDatabase();

const wait = async () => new Promise((resolve) => window.setTimeout(resolve, 80));
const clone = <T>(value: T): T => structuredClone(value);
const stamp = () => new Date().toISOString();

function findConversationForPlayer(playerId: string) {
  return db.conversations.find(
    (conversation) =>
      conversation.conversationType === "dm" &&
      conversation.participantIds.includes(db.activePlayerId) &&
      conversation.participantIds.includes(playerId),
  );
}

function slotForPlayer(player: Player): HouseSlot {
  return {
    slotIndex: db.neighborhood.houseSlots.length + 1,
    ownerPlayerId: player.playerId,
    displayName: player.displayName,
    relationship: "friend",
    presence: player.presence,
    exteriorPreset: db.houses[player.playerId]?.exteriorPreset ?? "moss-cottage",
    avatarConfig: player.avatarConfig,
    avatarModel: player.avatarModel,
    unreadCount: 0,
    lastActivity: stamp(),
  };
}

export function resetMockData() {
  db = createMockDatabase();
}

export const mockApi = {
  auth: {
    async login(displayName: string): Promise<SessionBootstrap> {
      await wait();
      const player = db.players[db.activePlayerId];
      player.displayName = displayName.trim() || player.displayName;
      db.neighborhood.homeSlot.displayName = player.displayName;
      return {
        player: clone(player),
        house: clone(db.houses[player.playerId]),
        avatarPresets: clone(db.avatarPresets),
        exteriorPresets: clone(db.exteriorPresets),
        interiorPresets: clone(db.interiorPresets),
      };
    },
    async bootstrap(): Promise<SessionBootstrap> {
      await wait();
      const player = db.players[db.activePlayerId];
      return {
        player: clone(player),
        house: clone(db.houses[player.playerId]),
        avatarPresets: clone(db.avatarPresets),
        exteriorPresets: clone(db.exteriorPresets),
        interiorPresets: clone(db.interiorPresets),
      };
    },
    async saveAvatar(
      avatarPresetId: string,
      displayName: string,
      avatarConfig: AvatarConfig,
      avatarModel: AvatarModel,
    ): Promise<Player> {
      await wait();
      const player = db.players[db.activePlayerId];
      player.avatarPresetId = avatarPresetId;
      player.avatarConfig = avatarConfig;
      player.avatarModel = avatarModel;
      player.displayName = displayName.trim() || player.displayName;
      db.neighborhood.homeSlot.displayName = player.displayName;
      db.neighborhood.homeSlot.avatarConfig = player.avatarConfig;
      db.neighborhood.homeSlot.avatarModel = player.avatarModel;
      return clone(player);
    },
  },
  chat: {
    async getConversations(): Promise<Conversation[]> {
      await wait();
      return clone(db.conversations);
    },
    async getMessages(conversationId: string): Promise<Message[]> {
      await wait();
      return clone(db.messages[conversationId] ?? []);
    },
    async markRead(conversationId: string): Promise<Conversation[]> {
      await wait();
      db.conversations = db.conversations.map((conversation) =>
        conversation.conversationId === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation,
      );
      const conversation = db.conversations.find((item) => item.conversationId === conversationId);
      if (conversation) {
        const otherPlayerId = conversation.participantIds.find((id) => id !== db.activePlayerId);
        if (otherPlayerId) {
          db.neighborhood.houseSlots = db.neighborhood.houseSlots.map((slot) =>
            slot.ownerPlayerId === otherPlayerId ? { ...slot, unreadCount: 0 } : slot,
          );
        }
      }
      return clone(db.conversations);
    },
    async sendMessage(conversationId: string, text: string): Promise<{
      conversation: Conversation;
      message: Message;
    }> {
      await wait();
      const message: Message = {
        messageId: `m-${Date.now()}`,
        conversationId,
        senderId: db.activePlayerId,
        text,
        createdAt: stamp(),
      };
      db.messages[conversationId] = [...(db.messages[conversationId] ?? []), message];
      const conversation = db.conversations.find((item) => item.conversationId === conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      conversation.lastMessagePreview = text;
      conversation.lastMessageAt = message.createdAt;
      conversation.unreadCount = 0;
      db.conversations = [
        conversation,
        ...db.conversations.filter((item) => item.conversationId !== conversationId),
      ];
      return { conversation: clone(conversation), message: clone(message) };
    },
    async getOrCreateDm(playerId: string): Promise<Conversation> {
      await wait();
      const existing = findConversationForPlayer(playerId);
      if (existing) {
        return clone(existing);
      }
      const player = db.players[playerId];
      const conversation: Conversation = {
        conversationId: `c-${player.username}`,
        conversationType: "dm",
        title: player.displayName,
        participantIds: [db.activePlayerId, playerId],
        unreadCount: 0,
        lastMessagePreview: "New neighbor chat",
        lastMessageAt: stamp(),
      };
      db.conversations = [conversation, ...db.conversations];
      db.messages[conversation.conversationId] = [];
      return clone(conversation);
    },
  },
  houses: {
    async getHouse(playerId: string): Promise<House> {
      await wait();
      return clone(db.houses[playerId]);
    },
    async visitHouse(playerId: string): Promise<House> {
      await wait();
      return clone(db.houses[playerId]);
    },
    async updateHouse(update: ProfileUpdate): Promise<House> {
      await wait();
      const playerId = db.activePlayerId;
      db.houses[playerId] = { ...db.houses[playerId], ...update, updatedAt: stamp() };
      db.neighborhood.homeSlot.exteriorPreset = db.houses[playerId].exteriorPreset;
      return clone(db.houses[playerId]);
    },
    async getNeighborhood(): Promise<Neighborhood> {
      await wait();
      return clone(db.neighborhood);
    },
  },
  friends: {
    async getUsers(): Promise<DirectoryUser[]> {
      await wait();
      return clone(db.directory);
    },
    async getRequests(): Promise<FriendRequest[]> {
      await wait();
      return clone(db.friendRequests.filter((request) => request.status !== "rejected"));
    },
    async requestFriend(playerId: string): Promise<DirectoryUser[]> {
      await wait();
      db.friendRequests = [
        ...db.friendRequests,
        {
          requestId: `fr-${Date.now()}`,
          fromPlayerId: db.activePlayerId,
          toPlayerId: playerId,
          status: "outgoing",
          createdAt: stamp(),
        },
      ];
      db.directory = db.directory.map((user) =>
        user.playerId === playerId ? { ...user, relationship: "requested" } : user,
      );
      return clone(db.directory);
    },
    async acceptFriend(requestId: string): Promise<{
      requests: FriendRequest[];
      users: DirectoryUser[];
      neighborhood: Neighborhood;
    }> {
      await wait();
      const request = db.friendRequests.find((item) => item.requestId === requestId);
      if (!request) {
        throw new Error("Friend request not found");
      }
      request.status = "accepted";
      const friendId = request.fromPlayerId === db.activePlayerId ? request.toPlayerId : request.fromPlayerId;
      const friend = db.players[friendId];
      db.directory = db.directory.map((user) =>
        user.playerId === friendId ? { ...user, relationship: "friend" } : user,
      );
      if (!db.neighborhood.houseSlots.some((slot) => slot.ownerPlayerId === friendId)) {
        db.neighborhood.houseSlots = [...db.neighborhood.houseSlots, slotForPlayer(friend)];
      }
      return {
        requests: clone(db.friendRequests.filter((item) => item.status !== "rejected")),
        users: clone(db.directory),
        neighborhood: clone(db.neighborhood),
      };
    },
    async rejectFriend(requestId: string): Promise<FriendRequest[]> {
      await wait();
      db.friendRequests = db.friendRequests.map((request) =>
        request.requestId === requestId ? { ...request, status: "rejected" } : request,
      );
      return clone(db.friendRequests.filter((request) => request.status !== "rejected"));
    },
  },
};
