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
          eyebrow="Account"
          isSaving={isLoading}
          onSave={handleSave}
          player={player}
          submitLabel="Save account"
          title="Avatar and profile"
        />
      </section>

      <aside className="avatar-page-aside">
        <div>
          <p className="text-sm font-black text-moss">Profile</p>
          <h2 className="mt-1 break-words text-xl font-black">{player.displayName}</h2>
          <p className="mt-1 text-sm font-bold text-ink/60">@{player.username}</p>
        </div>
        <div>
          <p className="text-sm font-black text-tide">Current file</p>
          <h3 className="mt-1 break-words text-lg font-black">
            {player.avatarModel?.fileName ?? player.avatarModel?.name ?? "Starter Walker"}
          </h3>
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
          <div>
            <dt>Turn</dt>
            <dd>{Math.round(player.avatarModel?.rotationY ?? 0)} deg</dd>
          </div>
          <div>
            <dt>Center</dt>
            <dd>
              {(player.avatarModel?.xOffset ?? 0).toFixed(2)}, {(player.avatarModel?.zOffset ?? 0).toFixed(2)}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
