import { FormEvent, useEffect, useMemo, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { useChatStore } from "../../state/useChatStore";
import { useNeighborhoodStore } from "../../state/useNeighborhoodStore";
import { useSessionStore } from "../../state/useSessionStore";
import { formatTime } from "../../utils/format";

export function ChatScreen() {
  const player = useSessionStore((state) => state.player);
  const conversations = useChatStore((state) => state.conversations);
  const messagesByConversation = useChatStore((state) => state.messagesByConversation);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const loadConversations = useChatStore((state) => state.loadConversations);
  const selectConversation = useChatStore((state) => state.selectConversation);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const directory = useNeighborhoodStore((state) => state.directory);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (conversations.length === 0) {
      void loadConversations();
    }
  }, [conversations.length, loadConversations]);

  const activeConversation = conversations.find(
    (conversation) => conversation.conversationId === activeConversationId,
  );
  const messages = activeConversationId ? messagesByConversation[activeConversationId] ?? [] : [];

  const namesByPlayerId = useMemo(() => {
    const names = new Map<string, string>();
    if (player) {
      names.set(player.playerId, player.displayName);
    }
    directory.forEach((user) => names.set(user.playerId, user.displayName));
    return names;
  }, [directory, player]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }
    await sendMessage(draft);
    setDraft("");
  };

  return (
    <div className="grid min-h-[calc(100vh-9rem)] gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="rounded-lg border-2 border-ink bg-white p-3 shadow-soft lg:min-h-[calc(100vh-9rem)]">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-sm font-semibold text-tide">Chat</p>
            <h2 className="text-xl font-black">Conversations</h2>
          </div>
          <MessageCircle aria-hidden="true" className="text-tide" size={24} />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible">
          {conversations.map((conversation) => {
            const isActive = conversation.conversationId === activeConversationId;
            return (
              <button
                className={`min-w-72 rounded-md border p-3 text-left transition lg:w-full ${
                  isActive ? "border-ink bg-ink text-white" : "border-ink/10 bg-paper text-ink hover:border-tide"
                }`}
                key={conversation.conversationId}
                type="button"
                onClick={() => void selectConversation(conversation.conversationId)}
                data-testid={`conversation-${conversation.conversationId}`}
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{conversation.title}</span>
                    <span className={`mt-1 block truncate text-xs font-semibold ${isActive ? "text-white/75" : "text-ink/60"}`}>
                      {conversation.lastMessagePreview}
                    </span>
                  </span>
                  {conversation.unreadCount > 0 ? (
                    <span className="rounded-full bg-coral px-2 py-1 text-xs font-black text-white">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </span>
                <span className={`mt-2 block text-xs font-semibold ${isActive ? "text-white/60" : "text-ink/50"}`}>
                  {conversation.conversationType.toUpperCase()} · {formatTime(conversation.lastMessageAt)}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="flex min-h-[36rem] flex-col rounded-lg border-2 border-ink bg-white shadow-soft">
        {activeConversation ? (
          <>
            <div className="border-b border-ink/10 p-4">
              <p className="text-sm font-semibold text-moss">{activeConversation.conversationType === "dm" ? "DM" : "Group"}</p>
              <h2 className="text-2xl font-black">{activeConversation.title}</h2>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-paper/70 p-4" data-testid="message-thread">
              {messages.map((message) => {
                const isMine = message.senderId === player?.playerId;
                return (
                  <article
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    key={message.messageId}
                  >
                    <div
                      className={`max-w-[82%] rounded-lg px-4 py-3 shadow-sm ${
                        isMine ? "bg-ink text-white" : "bg-white text-ink"
                      }`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs font-black opacity-70">
                        <span>{namesByPlayerId.get(message.senderId) ?? "Neighbor"}</span>
                        <span>{formatTime(message.createdAt)}</span>
                      </div>
                      <p className="break-words text-sm leading-6">{message.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            <form className="border-t border-ink/10 p-3" onSubmit={handleSubmit}>
              <div className="flex gap-2">
                <input
                  className="min-w-0 flex-1 rounded-md border border-ink/15 bg-paper px-4 py-3 font-semibold outline-none focus:border-tide focus:ring-4 focus:ring-tide/15"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Message"
                  data-testid="message-input"
                />
                <button
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-ink text-white transition hover:bg-moss disabled:opacity-60"
                  type="submit"
                  aria-label="Send message"
                  disabled={!draft.trim()}
                  data-testid="send-message"
                >
                  <Send aria-hidden="true" size={18} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-center">
            <p className="font-black text-ink/60">No conversation selected</p>
          </div>
        )}
      </section>
    </div>
  );
}
