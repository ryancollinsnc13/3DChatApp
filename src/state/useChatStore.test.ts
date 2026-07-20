import { act } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { resetMockData } from "../api/mockAdapter";
import { useChatStore } from "./useChatStore";
import { useNeighborhoodStore } from "./useNeighborhoodStore";
import { useSessionStore } from "./useSessionStore";

beforeEach(() => {
  resetMockData();
  useSessionStore.getState().reset();
  useChatStore.getState().reset();
  useNeighborhoodStore.getState().reset();
});

describe("useChatStore", () => {
  it("loads conversations, marks a selected thread read, and sends a message", async () => {
    await act(async () => {
      await useChatStore.getState().loadConversations();
    });

    expect(useChatStore.getState().conversations.length).toBeGreaterThan(0);

    await act(async () => {
      await useChatStore.getState().selectConversation("c-mara");
    });

    expect(
      useChatStore
        .getState()
        .conversations.find((conversation) => conversation.conversationId === "c-mara")?.unreadCount,
    ).toBe(0);

    await act(async () => {
      await useChatStore.getState().sendMessage("Testing the porch thread.");
    });

    const thread = useChatStore.getState().messagesByConversation["c-mara"];
    expect(thread.at(-1)?.text).toBe("Testing the porch thread.");
    expect(useChatStore.getState().conversations[0].lastMessagePreview).toBe("Testing the porch thread.");
  });
});
