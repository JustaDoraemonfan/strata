// src/pages/Settings.jsx
// Profile + preferences. Mostly display for now — edit flows come in V3.

import { useAuthStore } from "../store/authStore";

function Field({ label, value, mono = false }) {
  return (
    <div style={s.field}>
      <div style={s.fieldLabel}>{label}</div>
      <div
        style={{
          ...s.fieldValue,
          fontFamily: mono ? "'Google Sans Code', monospace" : "inherit",
        }}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={s.sectionTitle}>{children}</div>;
}

export default function Settings() {
  const user = useAuthStore((s) => s.user);

  const initials =
    user?.displayName
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.pageTitle}>settings</div>
        <div style={s.pageSub}>account & preferences</div>
      </div>

      <div style={s.content}>
        {/* Profile section */}
        <div style={s.section}>
          <SectionTitle>profile</SectionTitle>
          <div style={s.card}>
            {/* Avatar row */}
            <div style={s.avatarRow}>
              <div style={s.avatar}>{initials}</div>
              <div>
                <div style={s.displayName}>{user?.displayName ?? "—"}</div>
                <div style={s.email}>{user?.email ?? "—"}</div>
              </div>
            </div>
            <div style={s.divider} />
            <div style={s.fields}>
              <Field label="display name" value={user?.displayName} />
              <Field label="email" value={user?.email} mono />
              <Field
                label="timezone"
                value={user?.timezone ?? "Asia/Kolkata"}
                mono
              />
            </div>
          </div>
        </div>

        {/* Preferences section */}
        <div style={s.section}>
          <SectionTitle>preferences</SectionTitle>
          <div style={s.card}>
            <div style={s.fields}>
              <Field
                label="interruption threshold"
                value={`${user?.preferences?.interruptionThresholdMinutes ?? 5} minutes`}
              />
              <Field
                label="weekly report"
                value={
                  user?.preferences?.weeklyReportEnabled !== false
                    ? "enabled"
                    : "disabled"
                }
              />
            </div>
            <div style={s.hint}>
              preference editing coming in V3 — use the API to update for now
            </div>
          </div>
        </div>

        {/* About section */}
        <div style={s.section}>
          <SectionTitle>about</SectionTitle>
          <div style={s.card}>
            <div style={s.fields}>
              <Field label="product" value="Strata" />
              <Field
                label="version"
                value="v2.0 — analytics engine + auth"
                mono
              />
              <Field
                label="backend"
                value="Node.js · Express · MongoDB · Redis"
                mono
              />
              <Field
                label="stack"
                value="React 18 · Vite · Tailwind v3 · Zustand"
                mono
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const FONT = "'Google Sans Code', monospace";

const s = {
  page: { minHeight: "100vh", background: "#0e0e10", fontFamily: FONT },
  header: {
    padding: "20px 24px 16px",
    borderBottom: "0.5px solid rgba(255,255,255,0.06)",
  },
  pageTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: "rgba(255,255,255,0.85)",
    letterSpacing: "0.02em",
  },
  pageSub: {
    fontSize: 10,
    color: "rgba(255,255,255,0.2)",
    marginTop: 2,
    letterSpacing: "0.05em",
  },
  content: {
    padding: "20px 24px",
    maxWidth: 560,
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  section: {},
  sectionTitle: {
    fontSize: 9,
    color: "rgba(255,255,255,0.2)",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: 8,
  },
  card: {
    background: "#16161a",
    border: "0.5px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    overflow: "hidden",
  },
  avatarRow: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 18px",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: "50%",
    background: "#3C3489",
    border: "0.5px solid rgba(127,119,221,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 500,
    color: "#CECBF6",
    letterSpacing: "0.05em",
    flexShrink: 0,
  },
  displayName: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: 500,
  },
  email: {
    fontSize: 11,
    color: "rgba(255,255,255,0.28)",
    marginTop: 2,
    fontFamily: FONT,
  },
  divider: {
    height: "0.5px",
    background: "rgba(255,255,255,0.06)",
    margin: "0",
  },
  fields: { padding: "4px 0" },
  field: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 18px",
    borderBottom: "0.5px solid rgba(255,255,255,0.04)",
  },
  fieldLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: "0.03em",
  },
  fieldValue: { fontSize: 11, color: "rgba(255,255,255,0.65)" },
  hint: {
    fontSize: 10,
    color: "rgba(255,255,255,0.15)",
    padding: "10px 18px 14px",
    letterSpacing: "0.03em",
    fontStyle: "italic",
  },
};
