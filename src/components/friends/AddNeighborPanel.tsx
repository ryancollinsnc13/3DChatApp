import { Check, UserPlus, X } from "lucide-react";
import { useNeighborhoodStore } from "../../state/useNeighborhoodStore";

export function AddNeighborPanel() {
  const directory = useNeighborhoodStore((state) => state.directory);
  const friendRequests = useNeighborhoodStore((state) => state.friendRequests);
  const requestFriend = useNeighborhoodStore((state) => state.requestFriend);
  const acceptFriend = useNeighborhoodStore((state) => state.acceptFriend);
  const rejectFriend = useNeighborhoodStore((state) => state.rejectFriend);

  const incoming = friendRequests.filter((request) => request.status === "incoming");
  const candidates = directory.filter((user) => user.relationship !== "friend");

  return (
    <section className="rounded-lg border-2 border-ink bg-white p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-coral">Neighbors</p>
          <h2 className="text-xl font-black">Add Neighbor</h2>
        </div>
        {incoming.length > 0 ? (
          <span className="rounded-full bg-coral px-3 py-1 text-xs font-black text-white" data-testid="incoming-badge">
            {incoming.length} request
          </span>
        ) : null}
      </div>

      {incoming.length > 0 ? (
        <div className="mb-4 space-y-2">
          {incoming.map((request) => {
            const user = directory.find((item) => item.playerId === request.fromPlayerId);
            if (!user) {
              return null;
            }
            return (
              <div className="flex items-center justify-between gap-3 rounded-md bg-paper p-3" key={request.requestId}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black">{user.displayName}</p>
                  <p className="text-xs font-semibold text-ink/60">{user.presence}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-moss text-white"
                    type="button"
                    aria-label={`Accept ${user.displayName}`}
                    onClick={() => void acceptFriend(request.requestId)}
                    data-testid={`accept-${request.requestId}`}
                  >
                    <Check aria-hidden="true" size={16} />
                  </button>
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-coral"
                    type="button"
                    aria-label={`Reject ${user.displayName}`}
                    onClick={() => void rejectFriend(request.requestId)}
                  >
                    <X aria-hidden="true" size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="space-y-2">
        {candidates.map((user) => (
          <div className="flex items-center justify-between gap-3 rounded-md bg-paper p-3" key={user.playerId}>
            <div className="min-w-0">
              <p className="truncate text-sm font-black">{user.displayName}</p>
              <p className="text-xs font-semibold text-ink/60">{user.presence}</p>
            </div>
            <button
              className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black text-ink transition hover:bg-ink hover:text-white disabled:opacity-60"
              type="button"
              disabled={user.relationship === "requested"}
              onClick={() => void requestFriend(user.playerId)}
              data-testid={`request-${user.playerId}`}
            >
              <UserPlus aria-hidden="true" size={16} />
              {user.relationship === "requested" ? "Sent" : "Add"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
