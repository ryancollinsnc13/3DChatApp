import { Navigate } from "react-router-dom";
import { useNeighborhoodStore } from "../../state/useNeighborhoodStore";
import { useSessionStore } from "../../state/useSessionStore";
import type { AvatarConfig, AvatarModel } from "../../types/models";
import { AvatarUploadStudio } from "./AvatarUploadStudio";

export function AvatarPage() {
  const player = useSessionStore((state) => state.player);
  const isLoading = useSessionStore((state) => state.isLoading);
  const setupAvatar = useSessionStore((state) => state.setupAvatar);
  const refreshNeighborhood = useNeighborhoodStore((state) => state.refreshNeighborhood);

  if (!player) {
    return <Navigate to="/" replace />;
  }

  const handleSave = async (displayName: string, model: AvatarModel, config: AvatarConfig) => {
    await setupAvatar(model.sourceType === "upload" ? "uploaded-model" : model.modelId, displayName, config, model);
    await refreshNeighborhood();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section>
        <AvatarUploadStudio
          eyebrow="Avatar Model"
          isSaving={isLoading}
          onSave={handleSave}
          player={player}
          submitLabel="Save model"
          title="Your walking model"
        />
      </section>

      <aside className="avatar-page-aside">
        <div>
          <p className="text-sm font-black text-tide">Current file</p>
          <h2 className="mt-1 break-words text-xl font-black">
            {player.avatarModel?.fileName ?? player.avatarModel?.name ?? "Starter Walker"}
          </h2>
        </div>
        <dl className="avatar-model-details">
          <div>
            <dt>Source</dt>
            <dd>{player.avatarModel?.sourceType ?? "starter"}</dd>
          </div>
          <div>
            <dt>Scale</dt>
            <dd>{(player.avatarModel?.scale ?? 1).toFixed(2)}</dd>
          </div>
          <div>
            <dt>Floor offset</dt>
            <dd>{(player.avatarModel?.yOffset ?? 0).toFixed(2)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
