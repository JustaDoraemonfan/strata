import { useState, useEffect } from "react";
import { getSessions } from "../api/sessions";
import { getWeekInsight } from "../api/insights";

export const useDashboard = () => {
  const [sessions, setSessions] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
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

        const [sessionsRes, insightRes] = await Promise.all([
          getSessions(thirtyDaysAgo.toISOString(), now.toISOString()),
          getWeekInsight(monday.toISOString()),
        ]);

        setSessions(sessionsRes.data.data.sessions || []);
        setInsight(insightRes.data.data.insight || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  return { sessions, insight, loading, error };
};
