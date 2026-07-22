import { useState } from "react";
import { AddNeighborPanel } from "../friends/AddNeighborPanel";
import { NeighborhoodScene } from "../neighborhood/NeighborhoodScene";
import { useNeighborhoodStore } from "../../state/useNeighborhoodStore";
import { useSessionStore } from "../../state/useSessionStore";

export function HomeScreen() {
  const house = useSessionStore((state) => state.house);
  const exteriorPresets = useSessionStore((state) => state.exteriorPresets);
  const neighborhood = useNeighborhoodStore((state) => state.neighborhood);
  const [isAddingNeighbor, setIsAddingNeighbor] = useState(false);
  const [isInsideHouse, setIsInsideHouse] = useState(false);

  if (!house || !neighborhood) {
    return (
      <section className="map-screen">
        <div className="map-loading">Loading map...</div>
      </section>
    );
  }

  return (
    <section className="map-screen" data-testid="map-screen">
      {!isInsideHouse ? (
        <button
          className="scene-current-house-label map-current-house-button"
          data-testid="current-house-label"
          onClick={() => setIsInsideHouse(true)}
          type="button"
        >
          <span>Your house</span>
          <strong>{house.name}</strong>
        </button>
      ) : null}
      {!isInsideHouse && isAddingNeighbor ? (
        <div className="neighbor-panel-backdrop" data-testid="neighbor-panel-backdrop" onClick={() => setIsAddingNeighbor(false)}>
          <div className="neighbor-panel-dialog" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Close add neighbor panel"
              className="neighbor-panel-close"
              onClick={() => setIsAddingNeighbor(false)}
              type="button"
            >
              ×
            </button>
            <AddNeighborPanel />
          </div>
        </div>
      ) : null}
      <NeighborhoodScene
        activeRoomSlot={isInsideHouse ? neighborhood.homeSlot : null}
        exteriorPresets={exteriorPresets}
        invitedSlots={[]}
        neighborhood={neighborhood}
        onAddFriendHouse={() => setIsAddingNeighbor(true)}
        onEnterHome={() => setIsInsideHouse(true)}
        onExitRoom={() => setIsInsideHouse(false)}
        roomHouse={house}
      />
    </section>
  );
}
