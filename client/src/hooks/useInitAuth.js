import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const useInitAuth = () => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: refreshData } = await axios.post(
          "/api/auth/refresh",
          {},
          { withCredentials: true },
        );

        const { data: meData } = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${refreshData.data.accessToken}` },
          withCredentials: true,
        });

        useAuthStore
          .getState()
          .setAuth(refreshData.data.accessToken, meData.data.user);
      } catch {
        // no valid cookie — not logged in, stay on login page
      } finally {
        setReady(true);
      }
    };

    init();
  }, []);

  return ready;
};
