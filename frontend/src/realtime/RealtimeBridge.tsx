import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { getCsrfCookie } from "../api/auth";
import { createEcho } from "./echo";

const RealtimeBridge = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      return;
    }

    let disposed = false;
    let echo: ReturnType<typeof createEcho> | null = null;

    const setup = async () => {
      // Ensure Sanctum/XSRF cookies are present before Echo ctor reads xsrfHeader().
      await getCsrfCookie();
      if (disposed) {
        return;
      }

      echo = createEcho();
      const channel = echo.private(`users.${user.id}`);
      if (disposed) {
        return;
      }

      channel.listen(".friend.request.updated", () => {
        void queryClient.invalidateQueries({ queryKey: ["friends", "overview"] });
      });

      channel.listen(".social.signal.updated", () => {
        void queryClient.invalidateQueries({ queryKey: ["user", "media"] });
      });
    };

    void setup();

    return () => {
      disposed = true;
      // disconnect() closes all channels; leave() + disconnect() races on the same socket.
      echo?.disconnect();
    };
  }, [queryClient, user]);

  return null;
};

export default RealtimeBridge;
