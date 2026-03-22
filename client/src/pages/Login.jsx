import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data } = await login(email, password);
      setAuth(data.accessToken, data.user);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <span style={styles.logo}>STRATA</span>
          <span style={styles.logoDim}>.dev</span>
        </div>

        <p style={styles.tagline}>
          your code has layers. so does your productivity.
        </p>

        <div style={styles.divider} />

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={styles.error}>
              <span style={styles.errorDot} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "authenticating..." : "→ sign in"}
          </button>
        </form>

        <p style={styles.footer}>
          no account?{" "}
          <Link to="/register" style={styles.link}>
            register here
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#0e0e10",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'JetBrains Mono', monospace",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    background: "#16161a",
    border: "0.5px solid rgba(255,255,255,0.08)",
    borderTop: "1px solid rgba(127,119,221,0.4)",
    borderRadius: "12px",
    padding: "32px",
  },
  logoRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "2px",
    marginBottom: "8px",
  },
  logo: {
    fontSize: "18px",
    fontWeight: "500",
    letterSpacing: "0.12em",
    color: "#e0dff8",
  },
  logoDim: {
    fontSize: "18px",
    color: "rgba(255,255,255,0.2)",
    letterSpacing: "0.08em",
  },
  tagline: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.2)",
    letterSpacing: "0.04em",
    marginBottom: "24px",
  },
  divider: {
    height: "0.5px",
    background: "rgba(255,255,255,0.07)",
    marginBottom: "24px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "10px",
    letterSpacing: "0.1em",
    color: "rgba(255,255,255,0.25)",
    textTransform: "uppercase",
  },
  input: {
    background: "#26262e",
    border: "0.5px solid rgba(255,255,255,0.08)",
    borderRadius: "6px",
    padding: "10px 12px",
    fontSize: "13px",
    color: "rgba(255,255,255,0.75)",
    fontFamily: "'JetBrains Mono', monospace",
    outline: "none",
    transition: "border-color 0.15s",
  },
  error: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "11px",
    color: "#f07070",
    background: "rgba(240,112,112,0.08)",
    border: "0.5px solid rgba(240,112,112,0.2)",
    borderRadius: "6px",
    padding: "8px 12px",
  },
  errorDot: {
    width: "5px",
    height: "5px",
    borderRadius: "50%",
    background: "#f07070",
    flexShrink: 0,
    boxShadow: "0 0 4px rgba(240,112,112,0.5)",
  },
  button: {
    background: "rgba(127,119,221,0.12)",
    border: "0.5px solid rgba(127,119,221,0.3)",
    borderRadius: "6px",
    padding: "11px",
    fontSize: "13px",
    color: "#a09af0",
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: "500",
    letterSpacing: "0.04em",
    marginTop: "4px",
    transition: "background 0.15s",
  },
  footer: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.2)",
    textAlign: "center",
    marginTop: "20px",
  },
  link: {
    color: "#a09af0",
    textDecoration: "none",
  },
};
