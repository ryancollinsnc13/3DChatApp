import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AvatarPage } from "../components/avatar/AvatarPage";
import { AvatarSetup } from "../components/avatar/AvatarSetup";
import { DevLogin } from "../components/auth/DevLogin";
import { HomeScreen } from "../components/home/HomeScreen";
import { AppShell } from "../components/layout/AppShell";
import { useNeighborhoodStore } from "../state/useNeighborhoodStore";
import { useSessionStore } from "../state/useSessionStore";

export function App() {
  const player = useSessionStore((state) => state.player);
  const loadNeighborhood = useNeighborhoodStore((state) => state.loadNeighborhood);
  const avatarReady = Boolean(player?.avatarModel);

  useEffect(() => {
    if (avatarReady) {
      void loadNeighborhood();
    }
  }, [avatarReady, loadNeighborhood]);

  if (!player) {
    return <DevLogin />;
  }

  if (!player.avatarModel) {
    return <AvatarSetup />;
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/account" element={<AvatarPage />} />
        <Route path="/avatar" element={<Navigate to="/account" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
