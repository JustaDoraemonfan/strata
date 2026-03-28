// src/pages/Insights.jsx
// Weekly insight history — all built insights, patterns, burnout scores.

import { useState, useEffect } from "react";
import { getInsights } from "../api/insights";

function riskColor(level) {
  if (level === "low") return "#5DCAA5";
  if (level === "moderate") return "#EF9F27";
  if (level === "high") return "#f07070";
  if (level === "critical") return "#ff4444";
  return "#5DCAA5";
}

function formatDuration(minutes) {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatWeekOf(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function WeekBar({ scoreBreakdown = {} }) {
  const values = DAYS.map((d) => scoreBreakdown[d] ?? 0);
  const max = Math.max(...values, 1);

  return (
    <div
      style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 32 }}
    >
      {values.map((score, i) => {
        const height = score ? Math.max(4, (score / max) * 28) : 4;
        const color =
          score >= 75
            ? "rgba(93,202,165,0.7)"
            : score >= 60
              ? "rgba(127,119,221,0.7)"
              : score > 0
                ? "rgba(240,112,112,0.7)"
                : "rgba(255,255,255,0.07)";
        return (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <div
              style={{
                width: 10,
                height,
                background: color,
                borderRadius: "2px 2px 0 0",
              }}
            />
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>
              {DAY_LABELS[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function InsightCard({ insight }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={s.card}>
      {/* Card header — always visible */}
      <div style={s.cardHeader} onClick={() => setExpanded((v) => !v)}>
        <div style={s.cardLeft}>
          <div style={s.weekLabel}>week of {formatWeekOf(insight.weekOf)}</div>
          <div style={s.cardStats}>
            <span>{insight.totalSessions} sessions</span>
            <span style={s.dot}>·</span>
            <span>{formatDuration(insight.totalFocusTime)} focus</span>
            <span style={s.dot}>·</span>
            <span style={{ color: "#a09af0" }}>
              avg {insight.averageStratumScore?.toFixed(1) ?? "—"}
            </span>
          </div>
        </div>

        <div style={s.cardRight}>
          <WeekBar scoreBreakdown={insight.scoreBreakdown} />

          <div style={s.riskPill}>
            <div
              style={{
                ...s.riskDot,
                background: riskColor(insight.burnoutRiskLevel),
              }}
            />
            <span
              style={{
                color: riskColor(insight.burnoutRiskLevel),
                fontSize: 10,
              }}
            >
              {insight.burnoutRiskLevel} risk · {insight.burnoutRiskScore}
            </span>
          </div>

          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{
              transition: "transform 0.2s",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
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
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={s.cardBody}>
          {/* Peak hours */}
          {insight.peakHours?.length > 0 && (
            <div style={s.detailBlock}>
              <div style={s.detailTitle}>peak hours</div>
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  flexWrap: "wrap",
                  marginTop: 6,
                }}
              >
                {insight.peakHours.map((h) => (
                  <span key={h} style={s.hourChip}>
                    {String(h).padStart(2, "0")}:00
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Patterns / signals */}
          {insight.patterns?.length > 0 && (
            <div style={s.detailBlock}>
              <div style={s.detailTitle}>signals</div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  marginTop: 6,
                }}
              >
                {insight.patterns.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        flexShrink: 0,
                        marginTop: 4,
                        background:
                          p.severity === "high"
                            ? "#f07070"
                            : p.severity === "medium"
                              ? "#EF9F27"
                              : "#5DCAA5",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.45)",
                        lineHeight: 1.5,
                      }}
                    >
                      {p.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Day-by-day scores */}
          <div style={s.detailBlock}>
            <div style={s.detailTitle}>daily scores</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 6,
                marginTop: 8,
              }}
            >
              {DAYS.map((day, i) => {
                const score = insight.scoreBreakdown?.[day] ?? 0;
                return (
                  <div key={day} style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 8,
                        color: "rgba(255,255,255,0.2)",
                        marginBottom: 3,
                      }}
                    >
                      {DAY_LABELS[i]}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: score
                          ? score >= 75
                            ? "#5DCAA5"
                            : score >= 60
                              ? "#a09af0"
                              : "#f07070"
                          : "rgba(255,255,255,0.12)",
                      }}
                    >
                      {score || "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getInsights(20);
        setInsights(res.data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <div style={s.pageTitle}>insights</div>
          <div style={s.pageSub}>
            {loading ? "loading..." : `${insights.length} weekly reports`}
          </div>
        </div>
      </div>

      <div style={s.content}>
        {loading ? (
          <div style={s.empty}>fetching insights...</div>
        ) : error ? (
          <div style={{ ...s.empty, color: "#f07070" }}>{error}</div>
        ) : insights.length === 0 ? (
          <div style={s.emptyState}>
            <div style={s.emptyTitle}>no insights built yet</div>
            <div style={s.emptySub}>
              POST /api/insights/build to generate your first weekly report
            </div>
          </div>
        ) : (
          <div style={s.list}>
            {insights.map((insight) => (
              <InsightCard key={String(insight.weekOf)} insight={insight} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const FONT = "'Google Sans Code', monospace";

const s = {
  page: { minHeight: "100vh", background: "#0e0e10", fontFamily: FONT },
  header: {
    display: "flex",
    alignItems: "center",
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
  content: { padding: "16px 24px 24px" },
  list: { display: "flex", flexDirection: "column", gap: 8 },
  card: {
    background: "#16161a",
    border: "0.5px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    cursor: "pointer",
    gap: 12,
  },
  cardLeft: { minWidth: 0 },
  weekLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 },
  cardStats: {
    display: "flex",
    gap: 6,
    fontSize: 10,
    color: "rgba(255,255,255,0.28)",
    marginTop: 3,
    flexWrap: "wrap",
  },
  dot: { color: "rgba(255,255,255,0.15)" },
  cardRight: { display: "flex", alignItems: "center", gap: 14, flexShrink: 0 },
  riskPill: { display: "flex", alignItems: "center", gap: 5 },
  riskDot: { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  cardBody: {
    borderTop: "0.5px solid rgba(255,255,255,0.06)",
    padding: "14px 16px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  detailBlock: {},
  detailTitle: {
    fontSize: 9,
    color: "rgba(255,255,255,0.2)",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  hourChip: {
    fontSize: 10,
    padding: "3px 9px",
    borderRadius: 4,
    background: "rgba(127,119,221,0.08)",
    border: "0.5px solid rgba(127,119,221,0.18)",
    color: "#a09af0",
  },
  empty: {
    padding: "60px 0",
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    letterSpacing: "0.08em",
  },
  emptyState: { padding: "80px 0", textAlign: "center" },
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
