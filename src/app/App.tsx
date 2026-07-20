import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AvatarPage } from "../components/avatar/AvatarPage";
import { AvatarSetup } from "../components/avatar/AvatarSetup";
import { DevLogin } from "../components/auth/DevLogin";
import { ChatScreen } from "../components/chat/ChatScreen";
import { HomeScreen } from "../components/home/HomeScreen";
import { AppShell } from "../components/layout/AppShell";
import { useChatStore } from "../state/useChatStore";
import { useNeighborhoodStore } from "../state/useNeighborhoodStore";
import { useSessionStore } from "../state/useSessionStore";

export function App() {
  const player = useSessionStore((state) => state.player);
  const loadConversations = useChatStore((state) => state.loadConversations);
  const loadNeighborhood = useNeighborhoodStore((state) => state.loadNeighborhood);
  const avatarReady = Boolean(player?.avatarModel);

  useEffect(() => {
    if (avatarReady) {
      void loadConversations();
      void loadNeighborhood();
    }
  }, [avatarReady, loadConversations, loadNeighborhood]);

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
        <Route path="/avatar" element={<AvatarPage />} />
        <Route path="/chat" element={<ChatScreen />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
