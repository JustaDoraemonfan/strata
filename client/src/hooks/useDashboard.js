import { useState, useEffect } from "react";
import { getSessions } from "../api/sessions";
import { getWeekInsight } from "../api/insights";

export const useDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // get monday of current week for insight
        const now = new Date();
        const day = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
        monday.setHours(0, 0, 0, 0);

        // 30 days back for recent sessions
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Fetch sessions — this is a hard failure if it fails
        const sessionsRes = await getSessions(
          thirtyDaysAgo.toISOString(),
          now.toISOString(),
        );
        setSessions(sessionsRes.data.data || []);

        // Fetch insight — 404 means no insight built yet for this week, not an error
        try {
          const insightRes = await getWeekInsight(monday.toISOString());
          setInsight(insightRes.data.data || null);
        } catch (insightErr) {
          // 404 = no insight for this week yet — treat as empty, not a failure
          if (insightErr.response?.status === 404) {
            setInsight(null);
          } else {
            throw insightErr; // re-throw real errors
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { sessions, insight, loading, error };
};