import { useEffect, useState } from "react";
import { refresh, getMe } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export const useInitAuth = () => {
  const [ready, setReady] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: refreshData } = await refresh();
        const { data: meData } = await getMe();
        setAuth(refreshData.accessToken, meData.user);
      } catch {
        // no valid cookie — user needs to log in, that's fine
      } finally {
        setReady(true);
      }
    };

    init();
  }, []);

  return ready;
};
