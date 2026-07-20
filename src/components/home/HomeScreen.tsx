import { FormEvent, useState } from "react";
import { DoorOpen, Lock, Save, ShieldCheck, Sparkles, UserRoundPlus } from "lucide-react";
import { AddNeighborPanel } from "../friends/AddNeighborPanel";
import { VisitPanel } from "../houses/VisitPanel";
import { NeighborhoodScene } from "../neighborhood/NeighborhoodScene";
import { useNeighborhoodStore } from "../../state/useNeighborhoodStore";
import { useSessionStore } from "../../state/useSessionStore";
import type { Privacy } from "../../types/models";
import { privacyLabel } from "../../utils/format";

const privacyOptions: Privacy[] = ["public", "friends_only", "private"];

export function HomeScreen() {
  const player = useSessionStore((state) => state.player);
  const house = useSessionStore((state) => state.house);
  const exteriorPresets = useSessionStore((state) => state.exteriorPresets);
  const interiorPresets = useSessionStore((state) => state.interiorPresets);
  const updateProfile = useSessionStore((state) => state.updateProfile);
  const neighborhood = useNeighborhoodStore((state) => state.neighborhood);
  const selectedHouse = useNeighborhoodStore((state) => state.selectedHouse);
  const selectHouse = useNeighborhoodStore((state) => state.selectHouse);
  const refreshNeighborhood = useNeighborhoodStore((state) => state.refreshNeighborhood);
  const [draft, setDraft] = useState(house);
  const [isSaving, setIsSaving] = useState(false);
  const [activeRoomOwnerId, setActiveRoomOwnerId] = useState<string | null>(null);
  const [invitedPlayerIds, setInvitedPlayerIds] = useState<string[]>([]);

  if (!player || !house || !draft || !neighborhood) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-black text-ink/60">Loading home...</p>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    await updateProfile({
      name: draft.name,
      status: draft.status,
      bio: draft.bio,
      privacy: draft.privacy,
      exteriorPreset: draft.exteriorPreset,
      interiorPreset: draft.interiorPreset,
    });
    await refreshNeighborhood();
    setIsSaving(false);
  };

  const allSlots = [neighborhood.homeSlot, ...neighborhood.houseSlots];
  const activeRoomSlot = activeRoomOwnerId
    ? allSlots.find((slot) => slot.ownerPlayerId === activeRoomOwnerId) ?? null
    : null;
  const invitedSlots = allSlots.filter((slot) => invitedPlayerIds.includes(slot.ownerPlayerId));
  const invitableSlots = allSlots.filter(
    (slot) =>
      slot.relationship === "friend" &&
      slot.ownerPlayerId !== activeRoomOwnerId &&
      !invitedPlayerIds.includes(slot.ownerPlayerId),
  );
  const roomHouse = selectedHouse?.ownerPlayerId === activeRoomOwnerId
    ? selectedHouse
    : activeRoomOwnerId === player.playerId
      ? house
      : null;

  const handleEnterHouse = async (ownerPlayerId: string) => {
    await selectHouse(ownerPlayerId);
    setActiveRoomOwnerId(ownerPlayerId);
    setInvitedPlayerIds([]);
  };

  const handleExitRoom = () => {
    setActiveRoomOwnerId(null);
    setInvitedPlayerIds([]);
  };

  const handleInvite = (ownerPlayerId: string) => {
    setInvitedPlayerIds((current) => [...current, ownerPlayerId]);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_390px]">
      <section className="space-y-4">
        <div className="rounded-lg border-2 border-ink bg-white p-4 shadow-soft">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-moss">Home</p>
              <h2 className="text-2xl font-black">{house.name}</h2>
            </div>
            <span
              className="flex items-center gap-2 rounded-md bg-mint px-3 py-2 text-sm font-black text-moss"
              data-testid="privacy-pill"
            >
              <ShieldCheck aria-hidden="true" size={16} />
              {privacyLabel(house.privacy)}
            </span>
          </div>
          <NeighborhoodScene
            activeRoomSlot={activeRoomSlot}
            exteriorPresets={exteriorPresets}
            invitedSlots={invitedSlots}
            neighborhood={neighborhood}
            onEnterHouse={(ownerPlayerId) => void handleEnterHouse(ownerPlayerId)}
            onExitRoom={handleExitRoom}
            onSelectHouse={(ownerPlayerId) => void selectHouse(ownerPlayerId)}
            roomHouse={roomHouse}
          />
          <div className="mt-4 rounded-lg border-2 border-ink bg-plaza p-3" data-testid="room-controls">
            {activeRoomSlot ? (
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-black text-coral">
                    <DoorOpen aria-hidden="true" size={16} />
                    Inside {roomHouse?.name ?? `${activeRoomSlot.displayName}'s room`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {invitedSlots.map((slot) => (
                      <span className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm font-black" key={slot.ownerPlayerId}>
                        {slot.displayName}
                      </span>
                    ))}
                    {invitedSlots.length === 0 ? (
                      <span className="rounded-md border-2 border-ink bg-white px-3 py-2 text-sm font-black text-ink/60">
                        Room is solo
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {invitableSlots.slice(0, 3).map((slot) => (
                    <button
                      className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-black text-ink transition hover:bg-skytoy"
                      key={slot.ownerPlayerId}
                      type="button"
                      onClick={() => handleInvite(slot.ownerPlayerId)}
                      data-testid={`invite-${slot.ownerPlayerId}`}
                    >
                      <UserRoundPlus aria-hidden="true" size={16} />
                      {slot.displayName}
                    </button>
                  ))}
                  <button
                    className="rounded-md bg-ink px-3 py-2 text-sm font-black text-white"
                    type="button"
                    onClick={handleExitRoom}
                    data-testid="exit-room-controls"
                  >
                    Outside
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-black text-tide">
                  <DoorOpen aria-hidden="true" size={16} />
                  Zoom into any house to see the room
                </p>
                <button
                  className="rounded-md bg-ink px-3 py-2 text-sm font-black text-white"
                  type="button"
                  onClick={() => void handleEnterHouse(player.playerId)}
                  data-testid="enter-my-house"
                >
                  Enter my house
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <form className="rounded-lg border-2 border-ink bg-white p-4 shadow-soft" onSubmit={handleSubmit}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-tide">Profile Room</p>
                <h2 className="text-xl font-black">House settings</h2>
              </div>
              <button
                className="flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-black text-white transition hover:bg-moss disabled:opacity-60"
                type="submit"
                disabled={isSaving}
                data-testid="save-profile"
              >
                <Save aria-hidden="true" size={16} />
                {isSaving ? "Saving" : "Save"}
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-ink/70">House name</span>
                <input
                  className="mt-2 w-full rounded-md border border-ink/15 bg-paper px-3 py-2 font-semibold outline-none focus:border-moss focus:ring-4 focus:ring-mint"
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  data-testid="house-name"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-ink/70">Status</span>
                <input
                  className="mt-2 w-full rounded-md border border-ink/15 bg-paper px-3 py-2 font-semibold outline-none focus:border-moss focus:ring-4 focus:ring-mint"
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                  data-testid="house-status"
                />
              </label>
            </div>

            <label className="mt-3 block">
              <span className="text-sm font-semibold text-ink/70">Bio</span>
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-md border border-ink/15 bg-paper px-3 py-2 font-semibold leading-6 outline-none focus:border-moss focus:ring-4 focus:ring-mint"
                value={draft.bio}
                onChange={(event) => setDraft({ ...draft, bio: event.target.value })}
                data-testid="house-bio"
              />
            </label>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div>
                <span className="text-sm font-semibold text-ink/70">Privacy</span>
                <div className="mt-2 grid gap-2">
                  {privacyOptions.map((privacy) => (
                    <button
                      className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-black transition ${
                        draft.privacy === privacy ? "bg-ink text-white" : "bg-paper text-ink hover:bg-mint"
                      }`}
                      key={privacy}
                      type="button"
                      onClick={() => setDraft({ ...draft, privacy })}
                      data-testid={`privacy-${privacy}`}
                    >
                      <Lock aria-hidden="true" size={15} />
                      {privacyLabel(privacy)}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-ink/70">Exterior</span>
                <select
                  className="mt-2 w-full rounded-md border border-ink/15 bg-paper px-3 py-2 font-semibold outline-none focus:border-tide focus:ring-4 focus:ring-tide/15"
                  value={draft.exteriorPreset}
                  onChange={(event) => setDraft({ ...draft, exteriorPreset: event.target.value })}
                  data-testid="exterior-preset"
                >
                  {exteriorPresets.map((preset) => (
                    <option key={preset.presetId} value={preset.presetId}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-ink/70">Interior</span>
                <select
                  className="mt-2 w-full rounded-md border border-ink/15 bg-paper px-3 py-2 font-semibold outline-none focus:border-tide focus:ring-4 focus:ring-tide/15"
                  value={draft.interiorPreset}
                  onChange={(event) => setDraft({ ...draft, interiorPreset: event.target.value })}
                  data-testid="interior-preset"
                >
                  {interiorPresets.map((preset) => (
                    <option key={preset.presetId} value={preset.presetId}>
                      {preset.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </form>

          <div className="rounded-lg border-2 border-ink bg-white p-4 shadow-soft">
            <p className="flex items-center gap-2 text-sm font-semibold text-honey">
              <Sparkles aria-hidden="true" size={16} />
              Neighborhood feed
            </p>
            <div className="mt-3 space-y-2">
              {[neighborhood.homeSlot, ...neighborhood.houseSlots].map((slot) => (
                <button
                  className="flex w-full items-center justify-between gap-3 rounded-md bg-paper p-3 text-left transition hover:bg-mint"
                  key={slot.ownerPlayerId}
                  type="button"
                  onClick={() => void selectHouse(slot.ownerPlayerId)}
                  data-testid={`feed-house-${slot.ownerPlayerId}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-black">{slot.displayName}</span>
                    <span className="block text-xs font-semibold text-ink/60">{slot.presence}</span>
                  </span>
                  {slot.unreadCount > 0 ? (
                    <span className="rounded-full bg-coral px-2 py-1 text-xs font-black text-white">
                      {slot.unreadCount}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <VisitPanel onEnterHouse={(ownerPlayerId) => void handleEnterHouse(ownerPlayerId)} />
        <AddNeighborPanel />
      </aside>
    </div>
  );
}
