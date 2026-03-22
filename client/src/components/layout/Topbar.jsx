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

export default function Topbar() {
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

  return (
    <div style={s.bar}>
      <div style={s.logo}>
        STRATA<span style={s.logoDim}>.dev</span>
      </div>
      <div style={s.nav}>
        {NAV.map(({ label, path }) => (
          <Link
            key={path}
            to={path}
            style={{
              ...s.navLink,
              color:
                location.pathname === path
                  ? "rgba(255,255,255,0.85)"
                  : "rgba(255,255,255,0.35)",
            }}
          >
            {label}
          </Link>
        ))}
      </div>
      <div style={s.right}>
        <div style={s.avatar}>{initials}</div>
        <span style={s.userName}>{user?.displayName}</span>
        <button onClick={handleLogout} style={s.logoutBtn}>
          logout
        </button>
      </div>
    </div>
  );
}

const s = {
  bar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "13px 20px",
    borderBottom: "0.5px solid rgba(255,255,255,0.07)",
    fontFamily: "'JetBrains Mono', monospace",
  },
  logo: {
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "0.12em",
    color: "#e0dff8",
  },
  logoDim: { color: "rgba(255,255,255,0.2)" },
  nav: { display: "flex", gap: 22 },
  navLink: {
    fontSize: 11,
    textDecoration: "none",
    letterSpacing: "0.06em",
    transition: "color 0.15s",
  },
  right: { display: "flex", alignItems: "center", gap: 10 },
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
  },
  userName: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
  logoutBtn: {
    fontSize: 10,
    color: "rgba(255,255,255,0.2)",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontFamily: "'JetBrains Mono', monospace', letterSpacing: '0.06em'",
    padding: 0,
  },
};
