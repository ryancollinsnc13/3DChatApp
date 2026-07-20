import { create } from "zustand";
import { chatApi } from "../api/chat";
import type { Conversation, Message } from "../types/models";

type ChatState = {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;
  loadConversations: () => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  openConversationForPlayer: (playerId: string) => Promise<Conversation>;
  reset: () => void;
};

const initialState = {
  conversations: [],
  messagesByConversation: {},
  activeConversationId: null,
  isLoading: false,
  error: null,
};

function upsertConversation(conversations: Conversation[], next: Conversation) {
  return [next, ...conversations.filter((conversation) => conversation.conversationId !== next.conversationId)];
}

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,
  async loadConversations() {
    set({ isLoading: true, error: null });
    try {
      const conversations = await chatApi.getConversations();
      const activeConversationId = get().activeConversationId ?? conversations[0]?.conversationId ?? null;
      const messagesByConversation = { ...get().messagesByConversation };
      if (activeConversationId) {
        messagesByConversation[activeConversationId] = await chatApi.getMessages(activeConversationId);
      }
      set({ conversations, activeConversationId, messagesByConversation, isLoading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to load chat", isLoading: false });
    }
  },
  async selectConversation(conversationId) {
    set({ activeConversationId: conversationId, isLoading: true, error: null });
    try {
      const [messages, conversations] = await Promise.all([
        chatApi.getMessages(conversationId),
        chatApi.markRead(conversationId),
      ]);
      set((state) => ({
        conversations,
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: messages,
        },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Unable to open chat", isLoading: false });
    }
  },
  async sendMessage(text) {
    const trimmed = text.trim();
    const conversationId = get().activeConversationId;
    if (!trimmed || !conversationId) {
      return;
    }
    const { conversation, message } = await chatApi.sendMessage(conversationId, trimmed);
    set((state) => ({
      conversations: upsertConversation(state.conversations, conversation),
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [...(state.messagesByConversation[conversationId] ?? []), message],
      },
    }));
  },
  async openConversationForPlayer(playerId) {
    const conversation = await chatApi.getOrCreateDm(playerId);
    const conversations = await chatApi.getConversations();
    const messages = await chatApi.getMessages(conversation.conversationId);
    set((state) => ({
      conversations,
      activeConversationId: conversation.conversationId,
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversation.conversationId]: messages,
      },
    }));
    return conversation;
  },
  reset() {
    set(initialState);
  },
}));
