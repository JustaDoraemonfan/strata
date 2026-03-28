import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { logout } from "../../api/auth";

const NAV = [
  { label: "dashboard", path: "/dashboard" },
  { label: "sessions", path: "/sessions" },
  { label: "insights", path: "/insights" },
  { label: "playground", path: "/playground" },
  { label: "docs", path: "/docs" },
];

// Logomark — three stacked bars representing session "strata" layers
function LogoMark() {
  return (
    <div style={s.logoMark}>
      <svg
        width="11"
        height="11"
        viewBox="0 0 10 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
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

export default function Topbar({ latestScore }) {
  const navigate = useNavigate();
  const location = useLocation();
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

  // First name only for the topbar
  const firstName = user?.displayName?.split(" ")[0] ?? "";

  return (
    <div style={s.bar}>
      {/* Left — logo */}
      <div style={s.logo}>
        <LogoMark />
        <span style={s.logoText}>
          STRATA<span style={s.logoDim}>.dev</span>
        </span>
      </div>

      {/* Center — nav (absolutely centered so it's always mid-bar) */}
      <nav style={s.nav}>
        {NAV.map(({ label, path }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                ...s.navLink,
                color: active
                  ? "rgba(255,255,255,0.88)"
                  : "rgba(255,255,255,0.32)",
                background: active ? "rgba(255,255,255,0.06)" : "transparent",
              }}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right — score pill + user + logout */}
      <div style={s.right}>
        {latestScore != null && (
          <div style={s.scorePill}>score · {latestScore}</div>
        )}
        <div style={s.divider} />
        <div style={s.avatar}>{initials}</div>
        <span style={s.userName}>{firstName}</span>
        <button onClick={handleLogout} style={s.logoutBtn}>
          logout
        </button>
      </div>
    </div>
  );
}

const FONT = "'Google Sans Code', monospace";

const s = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    height: 48,
    borderBottom: "0.5px solid rgba(255,255,255,0.07)",
    fontFamily: FONT,
    position: "relative",
  },
  // Left
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
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
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.14em",
    color: "#e0dff8",
  },
  logoDim: {
    color: "rgba(255,255,255,0.22)",
  },
  // Center
  nav: {
    display: "flex",
    gap: 2,
    position: "absolute",
    left: "50%",
    transform: "translateX(-50%)",
  },
  navLink: {
    fontSize: 11,
    textDecoration: "none",
    letterSpacing: "0.05em",
    padding: "5px 11px",
    borderRadius: 6,
    transition: "color 0.15s, background 0.15s",
  },
  // Right
  right: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  scorePill: {
    fontSize: 9,
    color: "#5DCAA5",
    background: "rgba(93,202,165,0.1)",
    border: "0.5px solid rgba(93,202,165,0.22)",
    padding: "3px 9px",
    borderRadius: 4,
    letterSpacing: "0.06em",
  },
  divider: {
    width: 1,
    height: 16,
    background: "rgba(255,255,255,0.08)",
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
  },
  userName: {
    fontSize: 11,
    color: "rgba(255,255,255,0.32)",
  },
  logoutBtn: {
    fontSize: 10,
    color: "rgba(255,255,255,0.22)",
    background: "none",
    border: "0.5px solid rgba(255,255,255,0.1)",
    cursor: "pointer",
    fontFamily: FONT,
    letterSpacing: "0.05em",
    padding: "4px 9px",
    borderRadius: 5,
  },
};
