import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useInitAuth } from "./hooks/useInitAuth";
import { useAuthStore } from "./store/authStore";

import AppShell from "./components/layout/AppShell";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Sessions from "./pages/Sessions";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";

function ProtectedRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const ready = useInitAuth();

  if (!ready) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.15)",
          fontSize: "11px",
          letterSpacing: "0.12em",
          fontFamily: "'Google Sans Code', monospace",
          background: "#0e0e10",
        }}
      >
        initializing...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Guest routes — no shell */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <Register />
            </GuestRoute>
          }
        />

        {/* Protected routes — rendered inside AppShell (sidebar layout) */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
