import { useSessionStore } from "../../state/useSessionStore";
import type { AvatarConfig, AvatarModel } from "../../types/models";
import { AvatarUploadStudio } from "./AvatarUploadStudio";

export function AvatarSetup() {
  const player = useSessionStore((state) => state.player);
  const setupAvatar = useSessionStore((state) => state.setupAvatar);
  const isLoading = useSessionStore((state) => state.isLoading);

  const handleSave = async (displayName: string, model: AvatarModel, config: AvatarConfig) => {
    await setupAvatar(model.sourceType === "upload" ? "uploaded-model" : model.modelId, displayName, config, model);
  };

  return (
    <main className="min-h-screen bg-life-sky text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-5 py-8">
        {player ? (
          <AvatarUploadStudio
            eyebrow="Avatar Model"
            isSaving={isLoading}
            onSave={handleSave}
            player={player}
            submitLabel="Move in"
            title="Upload your walker"
          />
        ) : null}
      </div>
    </main>
  );
}
