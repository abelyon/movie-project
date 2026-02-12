import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import type { TmdbMedia } from "../../types/tmdb";
import SavedButton from "../Discovery/components/SavedButton";
import LoadingSpinner from "../../components/LoadingSpinner";
import { ThumbsUp, ThumbsDown, ChevronLeft } from "lucide-react";

const formatRuntime = (minutes: number | undefined): string | null => {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

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
      const data = await api.getFavourites();
      const ids = new Set<string>(
        (data.favourites ?? []).map(
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
        // ignore
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
  const runtime =
    detail.media_type === "movie"
      ? detail.runtime
      : detail.episode_run_time?.[0] ?? null;
  const formattedRuntime = formatRuntime(runtime ?? undefined);
  const rating = detail.vote_average ? detail.vote_average.toFixed(1) : null;
  const certification = detail.certification ?? null;
  const genres = detail.genres ?? [];

  return (
    <div className="min-h-screen bg-[#252422] pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <BackButton />

      <div className="p-4 sm:p-5 md:p-6 lg:p-8  max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:gap-8 lg:gap-10 md:items-start">
          {posterUrl && (
            <div className="relative w-full md:w-72 lg:w-80 shrink-0 aspect-5/3 rounded-[36px] overflow-hidden mb-4 md:mb-0 md:sticky md:top-6">
              <img
                src={posterUrl}
                alt={title}
                className="w-full h-full object-cover object-top"
              />
              {certification && (
                <div className="absolute top-0 right-0 m-5 rounded-full px-4 py-2 bg-amber-400 flex items-center justify-center">
                  <span className="text-xl text-black font-space-grotesk font-bold">
                    {certification}
                  </span>
                </div>
              )}
              {formattedRuntime && (
                  <div className="absolute top-0 left-0 m-5 rounded-full px-4 py-2 bg-black/60 text-white text-xl font-space-grotesk font-bold">
                  {formattedRuntime}
                </div>
              )}
              {rating && (
                <div className="absolute bottom-0 right-0 m-5 rounded-full px-4 py-2 bg-black/60 text-white text-xl font-space-grotesk font-bold">
                  {rating}
                </div>
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-light-gray text-xl font-space-grotesk font-bold">{releaseYear}</span>
              <div className="flex gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => handleReaction("like")}
                  disabled={!isAuthenticated || reactionLoading}
                  className={`transition-colors p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0 sm:p-1 disabled:opacity-50 ${
                    reaction === "like"
                      ? "text-amber-400"
                      : "text-light-gray hover:text-[#FFFCF2]"
                  }`}
                  aria-label={reaction === "like" ? "Unlike" : "Like"}
                >
                  <ThumbsUp
                    size={24}
                    strokeWidth={2}
                    className="outline-none"
                    color={reaction === "like" ? "white" : "#A1A09E"}
                    fill={reaction === "like" ? "white" : "#A1A09E"}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleReaction("dislike")}
                  disabled={!isAuthenticated || reactionLoading}
                  className={`transition-colors p-2 -m-2 min-w-[44px] min-h-[44px] flex items-center justify-center sm:min-w-0 sm:min-h-0 sm:p-1 disabled:opacity-50 ${
                    reaction === "dislike"
                      ? "text-amber-400"
                      : "text-light-gray hover:text-[#FFFCF2]"
                  }`}
                  aria-label={reaction === "dislike" ? "Remove dislike" : "Dislike"}
                >
                  <ThumbsDown
                    size={24}
                    strokeWidth={2}
                    className="outline-none"
                    color={reaction === "dislike" ? "white" : "#A1A09E"}
                    fill={reaction === "dislike" ? "white" : "#A1A09E"}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-space-grotesk font-bold text-[#FFFCF2] leading-tight flex-1 min-w-0">
                {title}
              </h1>
              <div className="shrink-0 pt-0.5 sm:pt-1">
                <SavedButton
                  item={detail}
                  isSaved={isSaved}
                  onToggle={fetchSaved}
                  variant="icon"
                />
              </div>
            </div>

            {detail.overview && (
              <p className="text-light-gray text-medium sm:text-base font-space-grotesk font-bold leading-relaxed mb-5">
                {detail.overview}
              </p>
            )}

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {genres.map((g) => (
                  <span
                    key={g.id}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#403D39] text-[#FFFCF2] text-base sm:text-sm font-space-grotesk font-medium"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
