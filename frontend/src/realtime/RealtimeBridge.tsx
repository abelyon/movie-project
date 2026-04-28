import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { createEcho } from "./echo";

const RealtimeBridge = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      return;
    }

    const echo = createEcho();
    const channel = echo.private(`users.${user.id}`);

    channel.listen(".friend.request.updated", () => {
      void queryClient.invalidateQueries({ queryKey: ["friends", "overview"] });
    });

    channel.listen(".social.signal.updated", () => {
      void queryClient.invalidateQueries({ queryKey: ["media"] });
      void queryClient.invalidateQueries({ queryKey: ["saved"] });
    });

    return () => {
      echo.leave(`private-users.${user.id}`);
      echo.disconnect();
    };
  }, [queryClient, user]);

  return null;
};

export default RealtimeBridge;
