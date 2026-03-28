// src/pages/Sessions.jsx
// Full sessions list — score badges, expandable rows, date range filter.

import { useState } from "react";
import { getSessions } from "../api/sessions";
import { useEffect } from "react";

// ─── Helpers (duplicated from Dashboard intentionally — no shared util yet) ───

function scoreColor(score) {
  if (score >= 75) return "#5DCAA5";
  if (score >= 60) return "#a09af0";
  if (score > 0) return "#f07070";
  return "rgba(255,255,255,0.15)";
}

function scoreBg(score) {
  if (score >= 75) return "rgba(93,202,165,0.1)";
  if (score >= 60) return "rgba(127,119,221,0.1)";
  if (score > 0) return "rgba(240,112,112,0.1)";
  return "rgba(255,255,255,0.04)";
}

function scoreBorder(score) {
  if (score >= 75) return "rgba(93,202,165,0.22)";
  if (score >= 60) return "rgba(127,119,221,0.22)";
  if (score > 0) return "rgba(240,112,112,0.22)";
  return "rgba(255,255,255,0.08)";
}

function scoreLabel(score) {
  if (score == null) return "unscored";
  if (score >= 90) return "elite";
  if (score >= 75) return "strong";
  if (score >= 60) return "decent";
  if (score >= 40) return "weak";
  return "poor";
}

function formatDuration(minutes) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatTime(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// ─── Score bar component ───────────────────────────────────────────────────────

function ScoreBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.3)",
          width: 110,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 3,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 10,
          color,
          width: 36,
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {value ?? "—"} / {max}
      </span>
    </div>
  );
}

// ─── Expanded session detail ──────────────────────────────────────────────────

function SessionDetail({ session }) {
  const cs = session.componentScores ?? {};
  const scoreBarColor = scoreColor(session.stratumScore);

  return (
    <div style={s.detail}>
      <div style={s.detailGrid}>
        {/* Score breakdown */}
        <div style={s.detailSection}>
          <div style={s.detailLabel}>score breakdown</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 7,
              marginTop: 8,
            }}
          >
            <ScoreBar
              label="commit cadence"
              value={cs.commitCadence}
              max={25}
              color={scoreBarColor}
            />
            <ScoreBar
              label="error rate"
              value={cs.errorRate}
              max={25}
              color={scoreBarColor}
            />
            <ScoreBar
              label="edit velocity"
              value={cs.editVelocity}
              max={20}
              color={scoreBarColor}
            />
            <ScoreBar
              label="focus depth"
              value={cs.focusDepth}
              max={20}
              color={scoreBarColor}
            />
            <ScoreBar
              label="session duration"
              value={cs.sessionDuration}
              max={10}
              color={scoreBarColor}
            />
          </div>
        </div>

        {/* Event breakdown */}
        <div style={s.detailSection}>
          <div style={s.detailLabel}>event breakdown</div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 5,
              marginTop: 8,
            }}
          >
            {Object.entries(session.eventBreakdown ?? {}).map(
              ([type, count]) => (
                <div
                  key={type}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}
                  >
                    {type}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.6)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {count}
                  </span>
                </div>
              ),
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 4,
                borderTop: "0.5px solid rgba(255,255,255,0.06)",
                marginTop: 2,
              }}
            >
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>
                total events
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                {session.totalEvents}
              </span>
            </div>
          </div>
        </div>

        {/* Focus blocks */}
        <div style={s.detailSection}>
          <div style={s.detailLabel}>
            focus blocks ({session.focusBlocks?.length ?? 0})
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginTop: 8,
            }}
          >
            {session.focusBlocks?.length > 0 ? (
              session.focusBlocks.map((block, i) => (
                <div key={i} style={s.focusBlock}>
                  <span style={{ fontSize: 10, color: "#5DCAA5" }}>
                    {formatDuration(block.durationMinutes)}
                  </span>
                  <span
                    style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}
                  >
                    {formatTime(block.start)} – {formatTime(block.end)}
                  </span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)" }}>
                no focus blocks detected
              </span>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
                paddingTop: 4,
                borderTop: "0.5px solid rgba(255,255,255,0.06)",
              }}
            >
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)" }}>
                interruptions
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
                {session.interruptionCount ?? 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Session row ──────────────────────────────────────────────────────────────

function SessionRow({ session }) {
  const [expanded, setExpanded] = useState(false);
  const score = session.stratumScore;

  return (
    <div
      style={{
        ...s.row,
        borderBottom: expanded ? "none" : "0.5px solid rgba(255,255,255,0.05)",
      }}
    >
      <div style={s.rowMain} onClick={() => setExpanded((v) => !v)}>
        {/* Score badge */}
        <div
          style={{
            ...s.badge,
            color: scoreColor(score),
            background: scoreBg(score),
            border: `0.5px solid ${scoreBorder(score)}`,
          }}
        >
          {score ?? "—"}
        </div>

        {/* Project + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.project}>{session.projectId}</div>
          <div style={s.meta}>
            {formatDuration(session.durationMinutes)}
            &nbsp;·&nbsp;{session.eventBreakdown?.commit ?? 0} commits
            &nbsp;·&nbsp;{session.focusBlocks?.length ?? 0} focus blocks
            &nbsp;·&nbsp;{session.interruptionCount ?? 0} interruptions
          </div>
        </div>

        {/* Label + time */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 2,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              ...s.label,
              color: scoreColor(score),
              background: scoreBg(score),
              border: `0.5px solid ${scoreBorder(score)}`,
            }}
          >
            {scoreLabel(score)}
          </span>
          <span style={s.time}>{formatDateTime(session.startTime)}</span>
        </div>

        {/* Expand chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transition: "transform 0.2s",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            flexShrink: 0,
            color: "rgba(255,255,255,0.2)",
          }}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {expanded && <SessionDetail session={session} />}
    </div>
  );
}

// ─── Date range presets ───────────────────────────────────────────────────────

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeDays, setActiveDays] = useState(30);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const from = new Date();
        from.setDate(from.getDate() - activeDays);
        const res = await getSessions(from.toISOString(), now.toISOString());
        setSessions(res.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [activeDays]);

  const totalFocusTime = sessions.reduce(
    (sum, s) => sum + (s.durationMinutes ?? 0),
    0,
  );
  const avgScore =
    sessions.length > 0
      ? (
          sessions.reduce((sum, s) => sum + (s.stratumScore ?? 0), 0) /
          sessions.length
        ).toFixed(1)
      : null;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.pageTitle}>sessions</div>
          <div style={s.pageSub}>
            {loading
              ? "loading..."
              : `${sessions.length} sessions · last ${activeDays} days`}
          </div>
        </div>

        {/* Aggregate stats */}
        {!loading && sessions.length > 0 && (
          <div style={s.headerStats}>
            <div style={s.statChip}>
              <span style={s.statChipLabel}>avg score</span>
              <span style={{ ...s.statChipVal, color: "#a09af0" }}>
                {avgScore ?? "—"}
              </span>
            </div>
            <div style={s.statChip}>
              <span style={s.statChipLabel}>total time</span>
              <span style={s.statChipVal}>
                {formatDuration(totalFocusTime)}
              </span>
            </div>
          </div>
        )}

        {/* Date range filter */}
        <div style={s.presets}>
          {PRESETS.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => setActiveDays(days)}
              style={{
                ...s.presetBtn,
                background:
                  activeDays === days
                    ? "rgba(160,154,240,0.12)"
                    : "transparent",
                color:
                  activeDays === days ? "#a09af0" : "rgba(255,255,255,0.28)",
                border: `0.5px solid ${activeDays === days ? "rgba(160,154,240,0.3)" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={s.content}>
        {loading ? (
          <div style={s.empty}>fetching sessions...</div>
        ) : error ? (
          <div style={{ ...s.empty, color: "#f07070" }}>{error}</div>
        ) : sessions.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyTitle}>no sessions found</div>
            <div style={s.emptySub}>
              build a session from Postman to see it here
            </div>
          </div>
        ) : (
          <div style={s.list}>
            {sessions.map((session) => (
              <SessionRow key={session.sessionId} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const FONT = "'Google Sans Code', monospace";

const s = {
  page: {
    minHeight: "100vh",
    background: "#0e0e10",
    fontFamily: FONT,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "20px 24px 16px",
    borderBottom: "0.5px solid rgba(255,255,255,0.06)",
    flexWrap: "wrap",
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
  headerStats: {
    display: "flex",
    gap: 8,
    marginLeft: "auto",
  },
  statChip: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#16161a",
    border: "0.5px solid rgba(255,255,255,0.07)",
    borderRadius: 8,
    padding: "8px 14px",
    gap: 2,
  },
  statChipLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  statChipVal: {
    fontSize: 18,
    fontWeight: 500,
    color: "rgba(255,255,255,0.7)",
  },
  presets: {
    display: "flex",
    gap: 5,
  },
  presetBtn: {
    fontFamily: FONT,
    fontSize: 10,
    cursor: "pointer",
    padding: "5px 11px",
    borderRadius: 5,
    letterSpacing: "0.05em",
    transition: "all 0.15s",
  },
  content: {
    flex: 1,
    padding: "0 24px 24px",
  },
  list: {
    marginTop: 12,
    background: "#16161a",
    border: "0.5px solid rgba(255,255,255,0.07)",
    borderRadius: 12,
    overflow: "hidden",
  },
  row: {
    borderBottom: "0.5px solid rgba(255,255,255,0.05)",
  },
  rowMain: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    cursor: "pointer",
    transition: "background 0.12s",
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 500,
    flexShrink: 0,
  },
  project: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
  },
  meta: {
    fontSize: 10,
    color: "rgba(255,255,255,0.25)",
    marginTop: 2,
  },
  label: {
    fontSize: 9,
    padding: "2px 7px",
    borderRadius: 3,
    letterSpacing: "0.06em",
  },
  time: {
    fontSize: 10,
    color: "rgba(255,255,255,0.2)",
  },
  detail: {
    padding: "0 16px 16px",
    borderTop: "0.5px solid rgba(255,255,255,0.05)",
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    paddingTop: 14,
  },
  detailSection: {
    background: "#1a1a20",
    border: "0.5px solid rgba(255,255,255,0.06)",
    borderRadius: 8,
    padding: "12px 14px",
  },
  detailLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.2)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  focusBlock: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 8px",
    background: "rgba(93,202,165,0.05)",
    border: "0.5px solid rgba(93,202,165,0.12)",
    borderRadius: 4,
  },
  empty: {
    padding: "60px 0",
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    letterSpacing: "0.08em",
  },
  emptyState: {
    padding: "80px 0",
    textAlign: "center",
  },
  emptyTitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.18)",
    letterSpacing: "0.05em",
  },
};
