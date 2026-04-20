import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

type ReactionType = "like" | "dislike" | null;

export function useReaction(mediaType: string | undefined, mediaId: string | undefined) {
  const { isAuthenticated } = useAuth();
  const [reaction, setReactionState] = useState<ReactionType>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchReaction = useCallback(async () => {
    if (!isAuthenticated || !mediaType || !mediaId) {
      setReactionState(null);
      return;
    }
    try {
      const data = await api.getReaction(mediaType, parseInt(mediaId));
      setReactionState((data.reaction as ReactionType) ?? null);
    } catch {
      setReactionState(null);
    }
  }, [isAuthenticated, mediaType, mediaId]);

  useEffect(() => {
    fetchReaction();
  }, [fetchReaction]);

  const setReaction = useCallback(
    async (newReaction: "like" | "dislike") => {
      if (!isAuthenticated || !mediaType || !mediaId || isLoading) return;
      setIsLoading(true);
      try {
        const data = await api.setReaction(mediaType, parseInt(mediaId), newReaction);
        setReactionState((data.reaction as ReactionType) ?? null);
      } catch {
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, mediaType, mediaId, isLoading]
  );

  return { reaction, setReaction, isLoading };
}
