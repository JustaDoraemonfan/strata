import { useInitAuth } from "./hooks/useInitAuth";
import { useAuthStore } from "./store/authStore";

export default function App() {
  const ready = useInitAuth();
  const user = useAuthStore((s) => s.user);

  if (!ready) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.2)",
          fontSize: "12px",
          letterSpacing: "0.1em",
          fontFamily: "monospace",
        }}
      >
        initializing...
      </div>
    );
  }

  return (
    <div>
      {user ? (
        <p style={{ color: "white", padding: 20 }}>
          logged in as {user.displayName}
        </p>
      ) : (
        <p style={{ color: "white", padding: 20 }}>not logged in</p>
      )}
    </div>
  );
}
