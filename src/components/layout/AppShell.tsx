import { useEffect } from "react";
import { Box, Home, LogOut, MessageCircle, UserRound } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useSessionStore } from "../../state/useSessionStore";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/avatar", label: "Avatar", icon: UserRound },
  { to: "/chat", label: "Chat", icon: MessageCircle },
];

export function AppShell() {
  const location = useLocation();
  const player = useSessionStore((state) => state.player);
  const house = useSessionStore((state) => state.house);
  const logout = useSessionStore((state) => state.logout);

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-life-sky text-ink">
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="avatar-shell-model" aria-hidden="true">
              <Box size={18} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink/60">
                {player?.avatarModel?.fileName ?? house?.name ?? "Home"}
              </p>
              <h1 className="truncate text-lg font-black">{player?.displayName ?? "Neighbor"}</h1>
            </div>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-md border border-ink/10 bg-white text-ink transition hover:border-coral hover:text-coral"
            type="button"
            aria-label="Sign out"
            onClick={logout}
          >
            <LogOut aria-hidden="true" size={18} />
          </button>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-7xl px-4 pb-24 pt-4 sm:pb-8">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 px-4 py-3 shadow-soft backdrop-blur sm:hidden">
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                className={({ isActive }) =>
                  `flex items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-black transition ${
                    isActive ? "bg-ink text-white" : "bg-paper text-ink"
                  }`
                }
                key={item.to}
                to={item.to}
              >
                <Icon aria-hidden="true" size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <nav className="fixed left-1/2 top-3 z-40 hidden -translate-x-1/2 rounded-md border border-ink/10 bg-white p-1 shadow-soft sm:flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={({ isActive }) =>
                `flex items-center gap-2 rounded px-4 py-2 text-sm font-black transition ${
                  isActive ? "bg-ink text-white" : "text-ink/70 hover:bg-paper hover:text-ink"
                }`
              }
              key={item.to}
              to={item.to}
            >
              <Icon aria-hidden="true" size={16} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
