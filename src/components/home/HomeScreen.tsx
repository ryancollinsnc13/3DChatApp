import { useState } from "react";
import { NeighborhoodScene } from "../neighborhood/NeighborhoodScene";
import { useNeighborhoodStore } from "../../state/useNeighborhoodStore";
import { useSessionStore } from "../../state/useSessionStore";

export function HomeScreen() {
  const house = useSessionStore((state) => state.house);
  const exteriorPresets = useSessionStore((state) => state.exteriorPresets);
  const neighborhood = useNeighborhoodStore((state) => state.neighborhood);
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
      <NeighborhoodScene
        activeRoomSlot={isInsideHouse ? neighborhood.homeSlot : null}
        exteriorPresets={exteriorPresets}
        invitedSlots={[]}
        neighborhood={neighborhood}
        onEnterHome={() => setIsInsideHouse(true)}
        onExitRoom={() => setIsInsideHouse(false)}
        roomHouse={house}
      />
    </section>
  );
}
