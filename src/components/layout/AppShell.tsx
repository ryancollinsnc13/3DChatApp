import { useEffect } from "react";
import { Home, UserRound } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const sidePanelItems = [
  { to: "/home", label: "Neighbourhood", icon: Home },
  { to: "/account", label: "Account", icon: UserRound },
];

export function AppShell() {
  const location = useLocation();
  const isMapRoute = location.pathname === "/home" || location.pathname === "/";

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, [location.pathname]);

  return (
    <div className={isMapRoute ? "app-map-shell text-ink" : "min-h-screen bg-life-sky text-ink"}>
      <aside className="app-side-panel" aria-label="App sections">
        {sidePanelItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              className={({ isActive }) =>
                `app-side-panel-link ${isActive ? "app-side-panel-link-active" : ""}`
              }
              key={item.to}
              to={item.to}
            >
              <Icon aria-hidden="true" size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </aside>

      <main className={isMapRoute ? "app-map-main" : "app-account-main"}>
        <Outlet />
      </main>
    </div>
  );
}
