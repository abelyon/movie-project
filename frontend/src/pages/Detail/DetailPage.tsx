import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useDetail } from "../../hooks/useDetail";
import { useMediaState, useMediaActions } from "../../hooks/useMedia";
import type { MediaDetail, MovieDetail, TvDetail } from "../../api/tmdb";
import { ArrowLeft, Bookmark, Clapperboard, ThumbsDown, ThumbsUp, Tv } from "lucide-react";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const getTitle = (detail: MediaDetail, mediaType: string): string =>
  mediaType === "movie"
    ? ((detail as MovieDetail).title ?? "")
    : ((detail as TvDetail).name ?? "");

const getDate = (detail: MediaDetail, mediaType: string): string | undefined =>
  mediaType === "movie"
    ? (detail as MovieDetail).release_date
    : (detail as TvDetail).first_air_date;

const getRuntime = (detail: MediaDetail, mediaType: string): number | undefined => {
  if (mediaType !== "movie") return undefined;
  const r = (detail as MovieDetail).runtime;
  const n = typeof r === "string" ? parseInt(r, 10) : r;
  return typeof n === "number" && !Number.isNaN(n) ? n : undefined;
};

const getSeasonsLabel = (detail: MediaDetail, mediaType: string): string | undefined => {
  if (mediaType !== "tv") return undefined;
  const seasons = (detail as TvDetail).number_of_seasons;
  return seasons != null ? `${seasons} season${seasons !== 1 ? "s" : ""}` : undefined;
};

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const pill =
  "flex items-center justify-center bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md rounded-4xl p-3 cursor-pointer transition-colors";

const DetailPage = () => {
  const navigate = useNavigate();
  const { media_type, id } = useParams<{ media_type: string; id: string }>();
  const numericId = id ? parseInt(id, 10) : NaN;

  const { data, isLoading, isError, error } = useDetail(media_type, id);
  const { data: userState } = useMediaState(
    Number.isNaN(numericId) ? undefined : numericId,
    media_type,
  );
  const actions = useMediaActions(numericId, media_type ?? "movie");

  const [imageLoaded, setImageLoaded] = useState(false);
  const [isActionPending, setIsActionPending] = useState(false);

  const runAction = async (action: () => Promise<void>) => {
    if (isActionPending) return;
    setIsActionPending(true);
    try {
      await action();
    } finally {
      setIsActionPending(false);
    }
  };

  if (!media_type || !id)
    return <div className="p-5 text-neutral-400">Invalid route</div>;
  if (isLoading) {
    return (
      <div className="text-white overflow-hidden">
        <div className="relative z-10 mx-auto max-w-4xl px-5 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative w-full sm:w-56 sm:shrink-0">
              <div className="w-full h-50 sm:h-88 rounded-4xl bg-neutral-800/80 animate-pulse" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <div className="h-9 w-52 rounded-2xl bg-neutral-800/80 animate-pulse" />
                <div className="h-7 w-16 rounded-2xl bg-neutral-800/80 animate-pulse" />
              </div>
              <div className="mt-4 flex gap-2">
                <div className="h-7 w-24 rounded-4xl bg-neutral-800/80 animate-pulse" />
                <div className="h-7 w-28 rounded-4xl bg-neutral-800/80 animate-pulse" />
                <div className="h-7 w-20 rounded-4xl bg-neutral-800/80 animate-pulse" />
              </div>
              <div className="mt-4 space-y-3">
                <div className="h-4 w-full rounded bg-neutral-800/80 animate-pulse" />
                <div className="h-4 w-[95%] rounded bg-neutral-800/80 animate-pulse" />
                <div className="h-4 w-[88%] rounded bg-neutral-800/80 animate-pulse" />
                <div className="h-4 w-[92%] rounded bg-neutral-800/80 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (isError)
    return <p className="p-5 text-red-400">Error: {error?.message}</p>;
  if (!data) return null;

  const title = getTitle(data, media_type);
  const date = getDate(data, media_type);
  const runtime = getRuntime(data, media_type);
  const seasonsLabel = getSeasonsLabel(data, media_type);
  const poster = data.poster_path ? `${TMDB_IMAGE_BASE}/w1280${data.poster_path}` : null;

  const isSaved = userState?.is_saved ?? false;
  const isLiked = userState?.is_liked ?? false;
  const isDisliked = userState?.is_disliked ?? false;

  return (
    <div className="text-white overflow-hidden">
      <div className="relative z-10 mx-auto max-w-4xl px-5 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">

          {/* Poster */}
          {poster && (
            <motion.div
              className="relative w-full sm:w-56 sm:shrink-0"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease }}
            >
              <motion.div
                className="absolute inset-0 rounded-4xl bg-neutral-800/90 overflow-hidden aspect-2/3 h-full"
                animate={{ opacity: imageLoaded ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                style={{ pointerEvents: "none" }}
              >
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-transparent via-neutral-600/30 to-transparent"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  style={{ width: "60%", willChange: "transform" }}
                />
              </motion.div>
              <motion.img
                src={poster}
                alt={title}
                className="w-full h-50 object-cover rounded-4xl sm:h-full"
                onLoad={() => setImageLoaded(true)}
                initial={{ opacity: 0 }}
                animate={{ opacity: imageLoaded ? 1 : 0 }}
                transition={{ duration: 0.35 }}
              />
              <div className="absolute top-0 left-0 p-4 flex justify-between w-full pointer-events-none">
                <span className="flex items-center h-8 bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md px-2.5 py-1.5 rounded-4xl text-neutral-100">
                  {media_type === "movie"
                    ? <Clapperboard size={16} strokeWidth={2.5} />
                    : <Tv size={16} strokeWidth={2.5} />}
                </span>
                {data.vote_average != null && data.vote_average > 0 && (
                  <span className="flex items-center h-8 bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md px-2.5 py-1.5 rounded-4xl text-neutral-100 font-space-grotesk font-medium text-sm">
                    {data.vote_average.toFixed(1)}
                  </span>
                )}
              </div>
              {(media_type === "movie" && runtime != null && runtime > 0) || seasonsLabel ? (
                <div className="absolute bottom-0 right-0 p-4 pointer-events-none">
                  <span className="flex items-center h-8 bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md px-2.5 py-1.5 rounded-4xl text-neutral-100 font-space-grotesk font-medium text-sm whitespace-nowrap">
                    {media_type === "movie" && runtime != null && runtime > 0
                      ? `${runtime} min`
                      : seasonsLabel}
                  </span>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* Info */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease, delay: 0.05 }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-5">
                <h1 className="text-3xl font-space-grotesk font-bold">{title}</h1>
              </div>
              {date && (
                <span className="text-xl font-space-grotesk font-bold text-neutral-400 shrink-0">
                  {date.slice(0, 4)}
                </span>
              )}
            </div>

            {data.genres && data.genres.length > 0 && (
              <motion.p
                className="mt-4 flex flex-wrap gap-2"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } },
                }}
              >
                {data.genres.map((genre) => (
                  <motion.span
                    key={genre.id}
                    className="text-sm font-space-grotesk font-medium text-neutral-400 bg-neutral-800/80 border-t border-neutral-600 px-3 py-1 rounded-4xl"
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
                    }}
                  >
                    {genre.name}
                  </motion.span>
                ))}
              </motion.p>
            )}

            {data.overview && (
              <motion.p
                className="mt-4 leading-relaxed text-neutral-200"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease, delay: 0.25 }}
              >
                {data.overview}
              </motion.p>
            )}
          </motion.div>
        </div>
      </div>

      {/* Fixed action buttons — right side, nav-pill style */}
      <div
        className="fixed bottom-5 flex flex-col items-center gap-3 z-50"
        style={{ right: "max(1.25rem, calc((100vw - 56rem) / 2 + 1.25rem))" }}
      >
        <AnimatePresence>
          {isSaved && (
            <motion.div
              key="rating-buttons"
              className="flex flex-col items-center gap-3"
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.9 }}
              transition={{ duration: 0.2, ease }}
            >
              <motion.button
                onClick={() => {
                  if (isDisliked) return;
                  runAction(() => actions.dislike());
                }}
                className={`${pill} ${isDisliked ? "bg-red-500/80 border-red-400 text-white" : "text-neutral-300 hover:text-white"}`}
                title="Dislike"
                whileTap={{ scale: 0.93 }}
                disabled={isActionPending}
              >
                <ThumbsDown
                  size={20}
                  strokeWidth={2.5}
                  fill={isDisliked ? "currentColor" : "none"}
                />
              </motion.button>
              <motion.button
                onClick={() => {
                  if (isLiked) return;
                  runAction(() => actions.like());
                }}
                className={`${pill} ${isLiked ? "bg-green-500/80 border-green-400 text-white" : "text-neutral-300 hover:text-white"}`}
                title="Like"
                whileTap={{ scale: 0.93 }}
                disabled={isActionPending}
              >
                <ThumbsUp
                  size={20}
                  strokeWidth={2.5}
                  fill={isLiked ? "currentColor" : "none"}
                />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => runAction(() => (isSaved ? actions.unsave() : actions.save()))}
          className={`${pill} ${isSaved ? "bg-amber-500/80 border-amber-400 text-white" : "text-neutral-300 hover:text-white"}`}
          title={isSaved ? "Unsave" : "Save"}
          whileTap={{ scale: 0.93 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease }}
          disabled={isActionPending}
        >
          <Bookmark size={20} strokeWidth={2.5} fill={isSaved ? "currentColor" : "none"} />
        </motion.button>

        <motion.button
          onClick={() => navigate(-1)}
          className={`${pill} text-neutral-300 hover:text-white`}
          title="Back"
          whileTap={{ scale: 0.93 }}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease }}
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
};

export default DetailPage;
