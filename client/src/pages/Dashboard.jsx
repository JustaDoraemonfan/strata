//import { useAuthStore } from "../store/authStore";
import { useDashboard } from "../hooks/useDashboard";
import Topbar from "../components/layout/Topbar";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DAY_LABELS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function scoreColor(score) {
  if (score >= 75) return "#5DCAA5";
  if (score >= 60) return "#a09af0";
  if (score > 0) return "#f07070";
  return "rgba(255,255,255,0.15)";
}

function scoreBg(score) {
  if (score >= 75) return "rgba(93,202,165,0.12)";
  if (score >= 60) return "rgba(127,119,221,0.12)";
  if (score > 0) return "rgba(240,112,112,0.12)";
  return "rgba(255,255,255,0.04)";
}

function scoreBorder(score) {
  if (score >= 75) return "rgba(93,202,165,0.25)";
  if (score >= 60) return "rgba(127,119,221,0.25)";
  if (score > 0) return "rgba(240,112,112,0.25)";
  return "rgba(255,255,255,0.08)";
}

function scoreLabel(score) {
  if (score >= 90) return "elite session";
  if (score >= 75) return "strong session";
  if (score >= 60) return "decent session";
  if (score >= 40) return "weak session";
  return "poor session";
}

function formatDuration(minutes) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDay(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "today";
  return d.toLocaleDateString("en-IN", { weekday: "short" }).toLowerCase();
}

function riskColor(level) {
  if (level === "low") return "#5DCAA5";
  if (level === "moderate") return "#EF9F27";
  if (level === "high") return "#f07070";
  if (level === "critical") return "#ff4444";
  return "#5DCAA5";
}

export default function Dashboard() {
  //   const user = useAuthStore((s) => s.user);
  const { sessions, insight, loading } = useDashboard();

  const latestSession = sessions[0] || null;
  const recentSessions = sessions.slice(0, 5);

  const weekScores = insight?.scoreBreakdown || {};
  const maxBarScore = Math.max(...Object.values(weekScores).filter(Boolean), 1);

  const avgScore = insight?.averageStratumScore ?? null;
  const focusTime = insight?.totalFocusTime ?? null;
  const totalSessions = insight?.totalSessions ?? null;
  const burnoutScore = insight?.burnoutRiskScore ?? null;
  const burnoutLevel = insight?.burnoutRiskLevel ?? "low";
  const peakHours = insight?.peakHours ?? [];
  const patterns = insight?.patterns ?? [];

  return (
    <div style={s.page}>
      <Topbar />

      {loading ? (
        <div style={s.loading}>fetching your data...</div>
      ) : (
        <div style={s.main}>
          {/* HERO */}
          <div style={s.hero}>
            {/* Latest score */}
            <div
              style={{
                ...s.panel,
                borderTop: "1px solid rgba(127,119,221,0.35)",
              }}
            >
              <div style={s.sectionLabel}>latest stratum score</div>
              {latestSession ? (
                <>
                  <div
                    style={{
                      ...s.bigScore,
                      color: scoreColor(latestSession.stratumScore),
                    }}
                  >
                    {latestSession.stratumScore ?? "—"}
                  </div>
                  <span
                    style={{
                      ...s.scoreTag,
                      color: scoreColor(latestSession.stratumScore),
                      background: scoreBg(latestSession.stratumScore),
                      border: `0.5px solid ${scoreBorder(latestSession.stratumScore)}`,
                    }}
                  >
                    {scoreLabel(latestSession.stratumScore)}
                  </span>
                  <div style={s.scoreMeta}>
                    {latestSession.projectId} &nbsp;·&nbsp;{" "}
                    {formatDuration(latestSession.durationMinutes)}{" "}
                    &nbsp;·&nbsp; {latestSession.eventBreakdown?.commit ?? 0}{" "}
                    commits
                    <br />
                    {formatDay(latestSession.startTime)} &nbsp;·&nbsp;{" "}
                    {formatTime(latestSession.startTime)} –{" "}
                    {formatTime(latestSession.endTime)}
                  </div>
                  <div
                    style={{
                      marginTop: 12,
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                    }}
                  >
                    {[
                      [
                        "commit cadence",
                        latestSession.stratumScore
                          ? Math.round(latestSession.stratumScore * 0.25)
                          : "—",
                        25,
                      ],
                      [
                        "focus depth",
                        latestSession.stratumScore
                          ? Math.round(latestSession.stratumScore * 0.2)
                          : "—",
                        20,
                      ],
                      [
                        "edit velocity",
                        latestSession.stratumScore
                          ? Math.round(latestSession.stratumScore * 0.2)
                          : "—",
                        20,
                      ],
                      [
                        "error rate",
                        latestSession.stratumScore
                          ? Math.round(latestSession.stratumScore * 0.25)
                          : "—",
                        25,
                      ],
                      [
                        "session duration",
                        latestSession.stratumScore
                          ? Math.round(latestSession.stratumScore * 0.1)
                          : "—",
                        10,
                      ],
                    ].map(([label, val, max]) => (
                      <div key={label} style={s.inset}>
                        <span style={s.insetLabel}>{label}</span>
                        <span style={{ fontSize: 10, color: "#a09af0" }}>
                          {val} / {max}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={s.empty}>no sessions yet — start coding</div>
              )}
            </div>

            {/* Weekly bars */}
            <div
              style={{
                ...s.panel,
                borderTop: "1px solid rgba(127,119,221,0.35)",
              }}
            >
              <div style={s.sectionLabel}>this week</div>
              <div style={s.weekGrid}>
                {DAYS.map((day, i) => {
                  const score = weekScores[day] ?? 0;
                  const height = score
                    ? Math.max(8, (score / maxBarScore) * 52)
                    : 8;
                  const color = score
                    ? `rgba(${score >= 75 ? "93,202,165" : score >= 60 ? "127,119,221" : "240,112,112"},${0.4 + (score / 100) * 0.4})`
                    : "rgba(255,255,255,0.06)";
                  return (
                    <div key={day} style={s.dayCol}>
                      <div style={s.dayBarWrap}>
                        <div
                          style={{
                            width: 13,
                            borderRadius: "2px 2px 0 0",
                            height,
                            background: color,
                          }}
                        />
                      </div>
                      <div style={s.dayLabel}>{DAY_LABELS[i]}</div>
                      <div style={s.dayVal}>{score || "—"}</div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {[
                  ["sessions this week", totalSessions ?? "—"],
                  ["total focus time", formatDuration(focusTime)],
                  [
                    "weekly avg score",
                    avgScore != null ? avgScore.toFixed(1) : "—",
                  ],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color:
                          label === "weekly avg score"
                            ? "#a09af0"
                            : "rgba(255,255,255,0.7)",
                      }}
                    >
                      {val}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* STAT ROW */}
          <div style={s.statRow}>
            {[
              {
                label: "avg score",
                val: avgScore != null ? avgScore.toFixed(1) : "—",
                color: "#a09af0",
              },
              {
                label: "focus time",
                val: formatDuration(focusTime),
                color: "rgba(255,255,255,0.6)",
              },
              {
                label: "total sessions",
                val: totalSessions ?? "—",
                color: "#5DCAA5",
              },
              {
                label: "burnout risk",
                val: burnoutScore ?? "—",
                color: riskColor(burnoutLevel),
              },
            ].map(({ label, val, color }) => (
              <div key={label} style={s.statCard}>
                <div style={s.statLabel}>{label}</div>
                <div style={{ ...s.statVal, color }}>{val}</div>
              </div>
            ))}
          </div>

          {/* BOTTOM */}
          <div style={s.bottom}>
            {/* Recent sessions */}
            <div style={s.panel}>
              <div style={s.panelHeader}>
                <span style={s.panelTitle}>recent sessions</span>
                <span style={s.panelLink}>view all →</span>
              </div>
              {recentSessions.length === 0 ? (
                <div style={s.empty}>
                  no sessions found — build one from postman
                </div>
              ) : (
                recentSessions.map((sess) => (
                  <div key={sess.sessionId} style={s.sessionRow}>
                    <div
                      style={{
                        ...s.sessScore,
                        color: scoreColor(sess.stratumScore),
                        background: scoreBg(sess.stratumScore),
                        border: `0.5px solid ${scoreBorder(sess.stratumScore)}`,
                      }}
                    >
                      {sess.stratumScore ?? "—"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={s.sessProject}>{sess.projectId}</div>
                      <div style={s.sessDetail}>
                        {formatDuration(sess.durationMinutes)} &nbsp;·&nbsp;
                        {sess.eventBreakdown?.commit ?? 0} commits &nbsp;·&nbsp;
                        {sess.focusBlocks?.length ?? 0} focus blocks
                      </div>
                    </div>
                    <div style={s.sessTime}>{formatDay(sess.startTime)}</div>
                  </div>
                ))
              )}
            </div>

            {/* Burnout */}
            <div style={s.panel}>
              <div style={s.panelHeader}>
                <span style={s.panelTitle}>burnout risk</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
                  this week
                </span>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "rgba(255,255,255,0.2)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 4,
                    }}
                  >
                    risk score
                  </div>
                  <div
                    style={{
                      fontSize: 42,
                      fontWeight: 500,
                      color: riskColor(burnoutLevel),
                      lineHeight: 1,
                    }}
                  >
                    {burnoutScore ?? "—"}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: riskColor(burnoutLevel),
                      marginTop: 3,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {burnoutLevel} risk
                  </div>
                  <div style={s.riskTrack}>
                    <div
                      style={{
                        ...s.riskFill,
                        width: `${burnoutScore ?? 0}%`,
                        background: riskColor(burnoutLevel),
                      }}
                    />
                  </div>
                  <div style={s.riskLabels}>
                    <span>low</span>
                    <span>moderate</span>
                    <span>high</span>
                    <span>critical</span>
                  </div>
                </div>

                {patterns.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "rgba(255,255,255,0.2)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: 6,
                      }}
                    >
                      signals
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                      }}
                    >
                      {patterns.map((p, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 8,
                            fontSize: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              flexShrink: 0,
                              marginTop: 3,
                              background:
                                p.severity === "high"
                                  ? "#f07070"
                                  : p.severity === "medium"
                                    ? "#EF9F27"
                                    : "#5DCAA5",
                              boxShadow: `0 0 4px ${p.severity === "high" ? "rgba(240,112,112,0.5)" : p.severity === "medium" ? "rgba(239,159,39,0.5)" : "rgba(93,202,165,0.5)"}`,
                            }}
                          />
                          <span
                            style={{
                              color: "rgba(255,255,255,0.38)",
                              lineHeight: 1.4,
                            }}
                          >
                            {p.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {peakHours.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        color: "rgba(255,255,255,0.2)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: 4,
                      }}
                    >
                      peak hours
                    </div>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {peakHours.map((h) => (
                        <span key={h} style={s.hourChip}>
                          {String(h).padStart(2, "0")}:00
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#0e0e10",
    fontFamily: "'Google Sans Code', monospace",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    letterSpacing: "0.1em",
  },
  main: {
    padding: "18px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  hero: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  panel: {
    background: "#16161a",
    border: "0.5px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 16,
  },
  sectionLabel: {
    fontSize: 9,
    letterSpacing: "0.14em",
    color: "rgba(255,255,255,0.25)",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  bigScore: { fontSize: 58, fontWeight: 500, lineHeight: 1 },
  scoreTag: {
    display: "inline-block",
    fontSize: 10,
    padding: "3px 8px",
    borderRadius: 4,
    marginTop: 6,
  },
  scoreMeta: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    marginTop: 8,
    lineHeight: 1.6,
  },
  inset: {
    background: "#26262e",
    border: "0.5px solid rgba(255,255,255,0.06)",
    borderRadius: 6,
    padding: "8px 10px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insetLabel: { fontSize: 10, color: "rgba(255,255,255,0.25)" },
  weekGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 5,
    marginTop: 12,
  },
  dayCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
  },
  dayBarWrap: { height: 52, display: "flex", alignItems: "flex-end" },
  dayLabel: { fontSize: 8, color: "rgba(255,255,255,0.2)" },
  dayVal: { fontSize: 9, color: "rgba(255,255,255,0.4)" },
  statRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 },
  statCard: {
    background: "#1e1e24",
    border: "0.5px solid rgba(255,255,255,0.07)",
    borderRadius: 8,
    padding: "12px 14px",
  },
  statLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  statVal: { fontSize: 24, fontWeight: 500 },
  bottom: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 12 },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  panelTitle: {
    fontSize: 10,
    letterSpacing: "0.12em",
    color: "rgba(255,255,255,0.3)",
    textTransform: "uppercase",
  },
  panelLink: {
    fontSize: 10,
    color: "rgba(127,119,221,0.6)",
    cursor: "pointer",
  },
  sessionRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "9px 0",
    borderBottom: "0.5px solid rgba(255,255,255,0.05)",
  },
  sessScore: {
    width: 36,
    height: 36,
    borderRadius: 7,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 500,
    flexShrink: 0,
  },
  sessProject: { fontSize: 12, color: "rgba(255,255,255,0.75)" },
  sessDetail: { fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 2 },
  sessTime: {
    fontSize: 10,
    color: "rgba(255,255,255,0.2)",
    marginLeft: "auto",
    whiteSpace: "nowrap",
  },
  empty: { fontSize: 11, color: "rgba(255,255,255,0.2)", padding: "20px 0" },
  riskTrack: {
    height: 5,
    borderRadius: 3,
    background: "#26262e",
    border: "0.5px solid rgba(255,255,255,0.06)",
    overflow: "hidden",
    margin: "8px 0 4px",
  },
  riskFill: { height: "100%", borderRadius: 3 },
  riskLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 8,
    color: "rgba(255,255,255,0.18)",
  },
  hourChip: {
    fontSize: 10,
    padding: "3px 9px",
    borderRadius: 4,
    background: "rgba(127,119,221,0.1)",
    border: "0.5px solid rgba(127,119,221,0.2)",
    color: "#a09af0",
  },
};
