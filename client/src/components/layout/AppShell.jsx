import { useState } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { logout } from "../../api/auth";

// ─── Icons (inline SVG — no dep needed) ───────────────────────────────────────

function IconGrid() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect
        x="1"
        y="1"
        width="5.5"
        height="5.5"
        rx="1.2"
        fill="currentColor"
        opacity="0.9"
      />
      <rect
        x="8.5"
        y="1"
        width="5.5"
        height="5.5"
        rx="1.2"
        fill="currentColor"
        opacity="0.5"
      />
      <rect
        x="1"
        y="8.5"
        width="5.5"
        height="5.5"
        rx="1.2"
        fill="currentColor"
        opacity="0.5"
      />
      <rect
        x="8.5"
        y="8.5"
        width="5.5"
        height="5.5"
        rx="1.2"
        fill="currentColor"
        opacity="0.25"
      />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect
        x="2"
        y="9"
        width="4"
        height="4.5"
        rx="0.9"
        fill="currentColor"
        opacity="0.9"
      />
      <rect
        x="7.5"
        y="5.5"
        width="5.5"
        height="8"
        rx="0.9"
        fill="currentColor"
        opacity="0.6"
      />
      <rect
        x="2"
        y="1.5"
        width="4"
        height="4.5"
        rx="0.9"
        fill="currentColor"
        opacity="0.35"
      />
    </svg>
  );
}

function IconPulse() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M1 7.5h2.5l1.5-4 2.5 8 2-5.5 1 1.5H14"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M7.5 1v1.5M7.5 12.5V14M14 7.5h-1.5M2.5 7.5H1M11.95 3.05l-1.06 1.06M4.11 10.89l-1.06 1.06M11.95 11.95l-1.06-1.06M4.11 4.11L3.05 3.05"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconChevron({ collapsed }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      style={{
        transition: "transform 0.25s ease",
        transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path
        d="M8.5 3.5L5.5 6.5L8.5 9.5"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LogoMark() {
  return (
    <div style={s.logoMark}>
      <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
        <rect x="1" y="5.5" width="3" height="3.5" rx="0.8" fill="#CECBF6" />
        <rect x="5.5" y="3" width="3" height="6" rx="0.8" fill="#a09af0" />
        <rect
          x="1"
          y="1"
          width="3"
          height="3.5"
          rx="0.8"
          fill="rgba(160,154,240,0.4)"
        />
      </svg>
    </div>
  );
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: IconGrid },
  { label: "Sessions", path: "/sessions", icon: IconLayers },
  { label: "Insights", path: "/insights", icon: IconPulse },
];

const BOTTOM_ITEMS = [{ label: "Settings", path: "/settings", icon: IconGear }];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {}
    clearAuth();
    navigate("/login");
  };

  const initials =
    user?.displayName
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  const sidebarWidth = collapsed ? 52 : 200;

  return (
    <div style={s.root}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          ...s.sidebar,
          width: sidebarWidth,
          minWidth: sidebarWidth,
        }}
      >
        {/* Logo row */}
        <div
          style={{
            ...s.logoRow,
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          <div style={s.logoInner}>
            <LogoMark />
            {!collapsed && (
              <span style={s.logoText}>
                STRATA<span style={s.logoDim}>.dev</span>
              </span>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              style={s.collapseBtn}
              title="Collapse"
            >
              <IconChevron collapsed={false} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            style={{ ...s.collapseBtn, margin: "6px auto", display: "flex" }}
            title="Expand"
          >
            <IconChevron collapsed={true} />
          </button>
        )}

        {/* Primary nav */}
        <nav style={s.nav}>
          {!collapsed && <span style={s.navSection}>workspace</span>}
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              style={({ isActive }) => ({
                ...s.navItem,
                justifyContent: collapsed ? "center" : "flex-start",
                background: isActive ? "rgba(160,154,240,0.1)" : "transparent",
                color: isActive ? "#a09af0" : "rgba(255,255,255,0.32)",
                borderLeft: isActive
                  ? "2px solid #a09af0"
                  : "2px solid transparent",
              })}
            >
              <Icon />
              {!collapsed && <span style={s.navLabel}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Bottom nav */}
        <div style={s.bottomNav}>
          {BOTTOM_ITEMS.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              title={collapsed ? label : undefined}
              style={({ isActive }) => ({
                ...s.navItem,
                justifyContent: collapsed ? "center" : "flex-start",
                background: isActive ? "rgba(160,154,240,0.1)" : "transparent",
                color: isActive ? "#a09af0" : "rgba(255,255,255,0.32)",
                borderLeft: isActive
                  ? "2px solid #a09af0"
                  : "2px solid transparent",
              })}
            >
              <Icon />
              {!collapsed && <span style={s.navLabel}>{label}</span>}
            </NavLink>
          ))}

          {/* User row */}
          <div
            style={{
              ...s.userRow,
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <div style={s.avatar} title={user?.displayName}>
              {initials}
            </div>
            {!collapsed && (
              <div style={s.userInfo}>
                <span style={s.userName}>{user?.displayName ?? "—"}</span>
                <button onClick={handleLogout} style={s.logoutBtn}>
                  logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const FONT = "'Google Sans Code', monospace";

const s = {
  root: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#0e0e10",
    fontFamily: FONT,
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    background: "#111114",
    borderRight: "0.5px solid rgba(255,255,255,0.06)",
    transition:
      "width 0.22s cubic-bezier(0.4,0,0.2,1), min-width 0.22s cubic-bezier(0.4,0,0.2,1)",
    overflow: "hidden",
    flexShrink: 0,
    padding: "12px 0 12px",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    marginBottom: 20,
    minHeight: 32,
  },
  logoInner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    overflow: "hidden",
  },
  logoMark: {
    width: 22,
    height: 22,
    borderRadius: 6,
    background: "#26215C",
    border: "0.5px solid rgba(127,119,221,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  logoText: {
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: "0.14em",
    color: "#e0dff8",
    whiteSpace: "nowrap",
  },
  logoDim: {
    color: "rgba(255,255,255,0.22)",
  },
  collapseBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "rgba(225,225,225)",
    padding: 4,
    borderRadius: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "color 0.15s",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    padding: "0 8px",
  },
  navSection: {
    fontSize: 9,
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.5)",
    textTransform: "uppercase",
    padding: "0 8px",
    marginBottom: 4,
    whiteSpace: "nowrap",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "7px 8px",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 11,
    fontFamily: FONT,
    letterSpacing: "0.03em",
    transition: "background 0.12s, color 0.12s",
    cursor: "pointer",
    whiteSpace: "nowrap",
    overflow: "hidden",
  },
  navLabel: {
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  bottomNav: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
    padding: "0 8px",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: 9,
    padding: "10px 8px 2px",
    marginTop: 6,
    borderTop: "0.5px solid rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: "#3C3489",
    border: "0.5px solid rgba(127,119,221,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 9,
    fontWeight: 500,
    color: "#CECBF6",
    letterSpacing: "0.05em",
    flexShrink: 0,
    cursor: "default",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    overflow: "hidden",
    minWidth: 0,
  },
  userName: {
    fontSize: 11,
    color: "rgba(255,255,255)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  logoutBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 10,
    color: "rgba(255,255,255,0.4)",
    padding: 0,
    textAlign: "left",
    letterSpacing: "0.03em",
    transition: "color 0.15s",
  },
  main: {
    flex: 1,
    overflow: "auto",
    minWidth: 0,
  },
};
