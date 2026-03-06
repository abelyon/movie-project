import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import type { TmdbMedia } from "../../types/tmdb";
import SavedButton from "../Discovery/components/SavedButton";
import LoadingSpinner from "../../components/LoadingSpinner";
import { ThumbsUp, ThumbsDown, ChevronLeft } from "lucide-react";

type ReactionType = "like" | "dislike" | null;

const Detail = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [detail, setDetail] = useState<TmdbMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [reaction, setReaction] = useState<ReactionType>(null);
  const [reactionLoading, setReactionLoading] = useState(false);

  const fetchSaved = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getSaved();
      const ids = new Set<string>(
        (data.saved ?? []).map(
          (f: { media_type: string; tmdb_id: number }) =>
            `${f.media_type}-${f.tmdb_id}`
        )
      );
      if (type && id) {
        setIsSaved(ids.has(`${type}-${id}`));
      }
    } catch {
      setIsSaved(false);
    }
  }, [isAuthenticated, type, id]);

  useEffect(() => {
    if (!type || !id) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.getDetail(type, parseInt(id));
        setDetail({ ...data, id: parseInt(id), media_type: type as "movie" | "tv" });
      } catch {
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [type, id]);

  const fetchReaction = useCallback(async () => {
    if (!isAuthenticated || !type || !id) return;
    try {
      const data = await api.getReaction(type, parseInt(id));
      setReaction((data.reaction as ReactionType) ?? null);
    } catch {
      setReaction(null);
    }
  }, [isAuthenticated, type, id]);

  const handleReaction = useCallback(
    async (newReaction: "like" | "dislike") => {
      if (!isAuthenticated || !type || !id || reactionLoading) return;
      setReactionLoading(true);
      try {
        const data = await api.setReaction(type, parseInt(id), newReaction);
        setReaction((data.reaction as ReactionType) ?? null);
      } catch {
      } finally {
        setReactionLoading(false);
      }
    },
    [isAuthenticated, type, id, reactionLoading]
  );

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  useEffect(() => {
    fetchReaction();
  }, [fetchReaction]);

  const BackButton = () => (
    <div className="fixed bottom-0 right-0 z-10 p-4 sm:p-5 mb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:mb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="bg-[#403D39] rounded-full p-4 sm:p-5 min-w-[44px] min-h-[44px] flex items-center justify-center text-light-gray hover:text-[#FFFCF2] hover:bg-[#52504c] transition-colors"
        aria-label="Go back"
      >
        <ChevronLeft size={28} strokeWidth={2.5} />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-5 bg-[#252422] pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
        <BackButton />
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen p-5 bg-[#252422] pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
        <BackButton />
        <p className="text-[#FFFCF2]">Not found</p>
      </div>
    );
  }

  const posterUrl = detail.poster_path
    ? `https://image.tmdb.org/t/p/w500${detail.poster_path}`
    : null;
  const title = (detail as { title?: string; name?: string }).title ?? (detail as { title?: string; name?: string }).name ?? "Unknown";

  const releaseYear =
    (detail.release_date || detail.first_air_date || "").slice(0, 4) || null;
  const certification = detail.certification ?? null;
  const genres = detail.genres ?? [];

  return (
    <div className="min-h-screen bg-[#252422] pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <BackButton />

      <div className="p-4 sm:p-5 md:p-6 max-w-4xl mx-auto">
        {posterUrl && (
          <div className="relative w-full aspect-3/2 rounded-4xl overflow-hidden mb-4">
            <img
              src={posterUrl}
              alt={title}
              className="w-full h-full object-cover object-top"
            />
            {certification && (
              <div className="absolute top-3 right-3 rounded-full px-3 py-1.5 bg-amber-400 flex items-center justify-center">
                <span className="text-sm text-black font-space-grotesk font-bold">
                  {certification}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-space-grotesk font-bold text-[#FFFCF2] leading-tight flex-1 min-w-0">
            {title}
          </h1>
          {releaseYear && (
            <span className="text-[#FFFCF2] text-lg sm:text-xl font-space-grotesk font-bold shrink-0">
              {releaseYear}
            </span>
          )}
        </div>

        {detail.overview && (
          <div className="relative pr-14 sm:pr-16 mb-6">
            <button
              type="button"
              onClick={() => handleReaction("dislike")}
              disabled={!isAuthenticated || reactionLoading}
              className={`absolute top-0 right-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
                reaction === "dislike"
                  ? "bg-amber-400/90 text-black"
                  : "bg-[#403D39]/80 text-light-gray hover:text-[#FFFCF2]"
              }`}
              aria-label={reaction === "dislike" ? "Remove dislike" : "Dislike"}
            >
              <ThumbsDown
                size={22}
                strokeWidth={2}
                fill={reaction === "dislike" ? "currentColor" : "none"}
              />
            </button>
            <button
              type="button"
              onClick={() => handleReaction("like")}
              disabled={!isAuthenticated || reactionLoading}
              className={`absolute bottom-0 right-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 ${
                reaction === "like"
                  ? "bg-amber-400/90 text-black"
                  : "bg-[#403D39]/80 text-light-gray hover:text-[#FFFCF2]"
              }`}
              aria-label={reaction === "like" ? "Unlike" : "Like"}
            >
              <ThumbsUp
                size={22}
                strokeWidth={2}
                fill={reaction === "like" ? "currentColor" : "none"}
              />
            </button>
            <p className="text-[#FFFCF2] text-sm sm:text-base font-space-grotesk leading-relaxed">
              {detail.overview}
            </p>
          </div>
        )}

        {genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {genres.map((g) => (
              <span
                key={g.id}
                className="px-3 py-2 rounded-lg bg-neutral-800/80 border-t border-neutral-600 text-neutral-100 text-sm font-space-grotesk font-medium"
              >
                {g.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 right-0 z-10 p-4 sm:p-5 mb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:mb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="w-12 h-12 rounded-full bg-[#403D39]/90 flex items-center justify-center">
          <SavedButton
            item={detail}
            isSaved={isSaved}
            onToggle={fetchSaved}
            variant="icon"
          />
        </div>
      </div>
    </div>
  );
};

export default Detail;
