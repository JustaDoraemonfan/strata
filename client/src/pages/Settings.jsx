// src/pages/Settings.jsx
// Profile + preferences — inline editable fields.

import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { updateMe } from "../api/auth";

// ─── Inline editable field ────────────────────────────────────────────────────

function EditableField({ label, value, onSave, type = "text", mono = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleEdit = () => {
    setDraft(value ?? "");
    setError(null);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (String(draft) === String(value)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      setError(err.message || "save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div style={s.field}>
      <div style={s.fieldLabel}>{label}</div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
        }}
      >
        {editing ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              autoFocus
              type={type}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                ...s.input,
                fontFamily: mono ? FONT : "inherit",
                width: 180,
              }}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                ...s.actionBtn,
                ...s.saveBtn,
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? "..." : "save"}
            </button>
            <button
              onClick={handleCancel}
              style={{ ...s.actionBtn, ...s.cancelBtn }}
            >
              cancel
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{ ...s.fieldValue, fontFamily: mono ? FONT : "inherit" }}
            >
              {value ?? "—"}
            </span>
            <button onClick={handleEdit} style={s.editBtn}>
              edit
            </button>
          </div>
        )}
        {error && <span style={s.fieldError}>{error}</span>}
      </div>
    </div>
  );
}

// ─── Toggle field (for boolean preferences) ───────────────────────────────────

function ToggleField({ label, value, onSave }) {
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    setSaving(true);
    try {
      await onSave(!value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={s.field}>
      <div style={s.fieldLabel}>{label}</div>
      <button
        onClick={handleToggle}
        disabled={saving}
        style={{
          ...s.toggle,
          background: value
            ? "rgba(93,202,165,0.12)"
            : "rgba(255,255,255,0.04)",
          border: `0.5px solid ${value ? "rgba(93,202,165,0.3)" : "rgba(255,255,255,0.1)"}`,
          color: value ? "#5DCAA5" : "rgba(255,255,255,0.3)",
          opacity: saving ? 0.5 : 1,
        }}
      >
        {saving ? "..." : value ? "enabled" : "disabled"}
      </button>
    </div>
  );
}

// ─── Read-only field ──────────────────────────────────────────────────────────

function ReadOnlyField({ label, value, mono = false }) {
  return (
    <div style={s.field}>
      <div style={s.fieldLabel}>{label}</div>
      <span
        style={{
          ...s.fieldValue,
          fontFamily: mono ? FONT : "inherit",
          color: "rgba(255,255,255,0.35)",
        }}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={s.sectionTitle}>{children}</div>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [globalError, setGlobalError] = useState(null);

  const initials =
    user?.displayName
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "??";

  // Generic save — calls API, updates Zustand store on success
  const save = async (updates) => {
    setGlobalError(null);
    try {
      const { data } = await updateMe(updates);
      setUser(data.data.user);
    } catch (err) {
      const msg = err.response?.data?.error || "update failed";
      setGlobalError(msg);
      throw new Error(msg); // Re-throw so EditableField shows inline error too
    }
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div style={s.pageTitle}>settings</div>
        <div style={s.pageSub}>account & preferences</div>
      </div>

      {globalError && (
        <div style={s.globalError}>
          <span style={s.errorDot} />
          {globalError}
        </div>
      )}

      <div style={s.content}>
        {/* Profile section */}
        <div style={s.section}>
          <SectionTitle>profile</SectionTitle>
          <div style={s.card}>
            <div style={s.avatarRow}>
              <div style={s.avatar}>{initials}</div>
              <div>
                <div style={s.displayName}>{user?.displayName ?? "—"}</div>
                <div style={s.email}>{user?.email ?? "—"}</div>
              </div>
            </div>
            <div style={s.divider} />
            <div style={s.fields}>
              <EditableField
                label="display name"
                value={user?.displayName}
                onSave={(val) => save({ displayName: val.trim() })}
              />
              <ReadOnlyField label="email" value={user?.email} mono />
              <EditableField
                label="timezone"
                value={user?.timezone ?? "Asia/Kolkata"}
                mono
                onSave={(val) => save({ timezone: val.trim() })}
              />
            </div>
          </div>
        </div>

        {/* Preferences section */}
        <div style={s.section}>
          <SectionTitle>preferences</SectionTitle>
          <div style={s.card}>
            <div style={s.fields}>
              <EditableField
                label="interruption threshold (minutes)"
                value={String(
                  user?.preferences?.interruptionThresholdMinutes ?? 5,
                )}
                type="number"
                onSave={(val) =>
                  save({
                    preferences: { interruptionThresholdMinutes: Number(val) },
                  })
                }
              />
              <ToggleField
                label="weekly report"
                value={user?.preferences?.weeklyReportEnabled !== false}
                onSave={(val) =>
                  save({ preferences: { weeklyReportEnabled: val } })
                }
              />
            </div>
          </div>
        </div>

        {/* About section — always read-only */}
        <div style={s.section}>
          <SectionTitle>about</SectionTitle>
          <div style={s.card}>
            <div style={s.fields}>
              <ReadOnlyField label="product" value="Strata" />
              <ReadOnlyField
                label="version"
                value="v3.0 — analytics engine + auth + frontend"
                mono
              />
              <ReadOnlyField
                label="backend"
                value="Node.js · Express · MongoDB · Redis"
                mono
              />
              <ReadOnlyField
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  globalError: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    margin: "16px 24px 0",
    fontSize: 11,
    color: "#f07070",
    background: "rgba(240,112,112,0.08)",
    border: "0.5px solid rgba(240,112,112,0.2)",
    borderRadius: 6,
    padding: "8px 12px",
  },
  errorDot: {
    width: 5,
    height: 5,
    borderRadius: "50%",
    background: "#f07070",
    flexShrink: 0,
    boxShadow: "0 0 4px rgba(240,112,112,0.5)",
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
  },
  fields: { padding: "4px 0" },
  field: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 18px",
    borderBottom: "0.5px solid rgba(255,255,255,0.04)",
    minHeight: 44,
    flexWrap: "wrap",
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: "0.03em",
  },
  fieldValue: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
  },
  fieldError: {
    fontSize: 10,
    color: "#f07070",
  },
  input: {
    background: "#26262e",
    border: "0.5px solid rgba(127,119,221,0.35)",
    borderRadius: 5,
    padding: "5px 9px",
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    outline: "none",
  },
  actionBtn: {
    background: "none",
    border: "none",
    fontFamily: FONT,
    fontSize: 10,
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: 4,
    letterSpacing: "0.04em",
  },
  saveBtn: {
    background: "rgba(93,202,165,0.1)",
    border: "0.5px solid rgba(93,202,165,0.25)",
    color: "#5DCAA5",
  },
  cancelBtn: {
    color: "rgba(255,255,255,0.25)",
  },
  editBtn: {
    background: "none",
    border: "0.5px solid rgba(255,255,255,0.1)",
    fontFamily: FONT,
    fontSize: 9,
    cursor: "pointer",
    padding: "3px 8px",
    borderRadius: 4,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.06em",
  },
  toggle: {
    fontFamily: FONT,
    fontSize: 10,
    cursor: "pointer",
    padding: "4px 12px",
    borderRadius: 5,
    letterSpacing: "0.05em",
    transition: "all 0.15s",
  },
};
