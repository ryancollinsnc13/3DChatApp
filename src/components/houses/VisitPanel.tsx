import { DoorOpen, Home, MessageCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../../state/useChatStore";
import { useNeighborhoodStore } from "../../state/useNeighborhoodStore";
import { useSessionStore } from "../../state/useSessionStore";
import { formatDateTime, privacyLabel } from "../../utils/format";

type VisitPanelProps = {
  onEnterHouse: (ownerPlayerId: string) => void;
};

export function VisitPanel({ onEnterHouse }: VisitPanelProps) {
  const selectedHouse = useNeighborhoodStore((state) => state.selectedHouse);
  const selectedSlot = useNeighborhoodStore((state) => state.selectedSlot);
  const clearSelectedHouse = useNeighborhoodStore((state) => state.clearSelectedHouse);
  const openConversationForPlayer = useChatStore((state) => state.openConversationForPlayer);
  const player = useSessionStore((state) => state.player);
  const navigate = useNavigate();

  if (!selectedHouse || !selectedSlot) {
    return null;
  }

  const handleOpenChat = async () => {
    if (selectedHouse.ownerPlayerId === player?.playerId) {
      return;
    }
    await openConversationForPlayer(selectedHouse.ownerPlayerId);
    clearSelectedHouse();
    navigate("/chat");
  };

  return (
    <aside className="rounded-lg border-2 border-ink bg-white p-4 shadow-soft" data-testid="visit-panel">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-tide">
            <Home aria-hidden="true" size={16} />
            {selectedSlot.presence}
          </p>
          <h2 className="mt-1 truncate text-xl font-black">{selectedHouse.name}</h2>
        </div>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md bg-paper text-ink transition hover:bg-coral hover:text-white"
          type="button"
          aria-label="Close visit panel"
          onClick={clearSelectedHouse}
        >
          <X aria-hidden="true" size={18} />
        </button>
      </div>
      <p className="text-sm font-semibold text-ink/70">{selectedHouse.status}</p>
      <p className="mt-3 text-sm leading-6 text-ink/75">{selectedHouse.bio}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-md bg-paper p-3">
          <dt className="font-semibold text-ink/55">Privacy</dt>
          <dd className="mt-1 font-black">{privacyLabel(selectedHouse.privacy)}</dd>
        </div>
        <div className="rounded-md bg-paper p-3">
          <dt className="font-semibold text-ink/55">Updated</dt>
          <dd className="mt-1 font-black">{formatDateTime(selectedHouse.updatedAt)}</dd>
        </div>
      </dl>
      <button
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-coral px-4 py-3 font-bold text-white transition hover:bg-ink"
        type="button"
        onClick={() => onEnterHouse(selectedHouse.ownerPlayerId)}
        data-testid="visit-enter-room"
      >
        <DoorOpen aria-hidden="true" size={18} />
        Enter 3D room
      </button>
      {selectedHouse.ownerPlayerId !== player?.playerId ? (
        <button
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 font-bold text-white transition hover:bg-tide"
          type="button"
          onClick={handleOpenChat}
          data-testid="open-house-chat"
        >
          <MessageCircle aria-hidden="true" size={18} />
          Open chat
        </button>
      ) : null}
    </aside>
  );
}
