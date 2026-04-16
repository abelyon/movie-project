import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useDetail } from "../../hooks/useDetail";
import { useMediaState, useMediaActions, mediaItemFromDetail } from "../../hooks/useMedia";
import type { MediaDetail, MovieDetail, TvDetail } from "../../api/tmdb";
import { ArrowLeft, Bookmark, Clapperboard, ThumbsDown, ThumbsUp, Tv } from "lucide-react";
import type { MediaItem } from "../../api/types";
import { previewItemToDetail } from "../../utils/detailPreview";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const POSTER_SIZE = "w780";

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

const getUSProviders = (detail: MediaDetail) => detail.watch_providers?.results?.US;
const getCast = (detail: MediaDetail) =>
  (detail.credits?.cast ?? []).slice(0, 8).filter((p) => p?.name);

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const enterFast = { duration: 0.22, ease } as const;

const pill =
  "flex items-center justify-center bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md rounded-4xl p-3 cursor-pointer transition-colors";

function DetailPosterBlock({
  poster,
  title,
  mediaType,
  voteAverage,
  runtime,
  seasonsLabel,
}: {
  poster: string;
  title: string;
  mediaType: string;
  voteAverage: number | null | undefined;
  runtime: number | undefined;
  seasonsLabel: string | undefined;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <motion.div
      className="relative w-full sm:w-56 sm:shrink-0"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={enterFast}
    >
      <motion.div
        className="absolute inset-0 rounded-4xl bg-neutral-800/90 overflow-hidden aspect-2/3 h-full"
        animate={{ opacity: imageLoaded ? 0 : 1 }}
        transition={{ duration: 0.2 }}
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
        decoding="async"
        fetchPriority="high"
        onLoad={() => setImageLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <div className="absolute top-0 left-0 p-4 flex justify-between w-full pointer-events-none">
        <span className="flex items-center h-8 bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md px-2.5 py-1.5 rounded-4xl text-neutral-100">
          {mediaType === "movie" ? (
            <Clapperboard size={16} strokeWidth={2.5} />
          ) : (
            <Tv size={16} strokeWidth={2.5} />
          )}
        </span>
        {voteAverage != null && voteAverage > 0 && (
          <span className="flex items-center h-8 bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md px-2.5 py-1.5 rounded-4xl text-neutral-100 font-space-grotesk font-medium text-sm">
            {voteAverage.toFixed(1)}
          </span>
        )}
      </div>
      {(mediaType === "movie" && runtime != null && runtime > 0) || seasonsLabel ? (
        <div className="absolute bottom-0 right-0 p-4 pointer-events-none">
          <span className="flex items-center h-8 bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md px-2.5 py-1.5 rounded-4xl text-neutral-100 font-space-grotesk font-medium text-sm whitespace-nowrap">
            {mediaType === "movie" && runtime != null && runtime > 0
              ? `${runtime} min`
              : seasonsLabel}
          </span>
        </div>
      ) : null}
    </motion.div>
  );
}

type DetailLocationState = { preview?: MediaItem };

const DetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { media_type, id } = useParams<{ media_type: string; id: string }>();
  const numericId = id ? parseInt(id, 10) : NaN;

  const previewFromNav = (location.state as DetailLocationState | null)?.preview;
  const previewDetail =
    previewFromNav &&
    (media_type === "movie" || media_type === "tv") &&
    previewFromNav.id === numericId &&
    previewFromNav.media_type === media_type
      ? previewItemToDetail(previewFromNav, media_type)
      : null;

  const { data: fetched, isPending, isFetching, isError, error } = useDetail(
    media_type,
    id,
  );
  const data = fetched ?? previewDetail;
  const showSkeleton = isPending && !data;
  const { data: userState } = useMediaState(
    Number.isNaN(numericId) ? undefined : numericId,
    media_type,
  );
  const savedListPreview = useMemo(() => {
    if (!data || (media_type !== "movie" && media_type !== "tv")) return null;
    return mediaItemFromDetail(data, media_type);
  }, [data, media_type]);
  const actions = useMediaActions(
    numericId,
    media_type === "tv" ? "tv" : "movie",
    savedListPreview,
  );

  if (!media_type || !id)
    return <div className="p-5 text-neutral-400">Invalid route</div>;
  if (showSkeleton) {
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
  if (isError && !data)
    return <p className="p-5 text-red-400">Error: {error?.message}</p>;
  if (!data) return null;

  const title = getTitle(data, media_type);
  const date = getDate(data, media_type);
  const runtime = getRuntime(data, media_type);
  const seasonsLabel = getSeasonsLabel(data, media_type);
  const poster = data.poster_path
    ? `${TMDB_IMAGE_BASE}/${POSTER_SIZE}${data.poster_path}`
    : null;
  const isPreviewOnly = !fetched && !!previewDetail;

  const isSaved = userState?.is_saved ?? false;
  const isLiked = userState?.is_liked ?? false;
  const isDisliked = userState?.is_disliked ?? false;

  return (
    <div className="text-white overflow-hidden">
      <div className="relative z-10 mx-auto max-w-4xl px-5 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">

          {/* Poster */}
          {poster && (
            <DetailPosterBlock
              key={`${media_type}-${numericId}`}
              poster={poster}
              title={title}
              mediaType={media_type}
              voteAverage={data.vote_average}
              runtime={runtime}
              seasonsLabel={seasonsLabel}
            />
          )}

          {/* Info */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={enterFast}
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
                  visible: { transition: { staggerChildren: 0.03, delayChildren: 0 } },
                }}
              >
                {data.genres.map((genre) => (
                  <motion.span
                    key={genre.id}
                    className="text-sm font-space-grotesk font-medium text-neutral-400 bg-neutral-800/80 border-t border-neutral-600 px-3 py-1 rounded-4xl"
                    variants={{
                      hidden: { opacity: 0, y: 4 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease } },
                    }}
                  >
                    {genre.name}
                  </motion.span>
                ))}
              </motion.p>
            )}

            {isPreviewOnly && isFetching ? (
              <div className="mt-4 space-y-2" aria-hidden>
                <div className="h-4 w-full rounded bg-neutral-800/70 animate-pulse" />
                <div className="h-4 w-[92%] rounded bg-neutral-800/70 animate-pulse" />
                <div className="h-4 w-[85%] rounded bg-neutral-800/70 animate-pulse" />
              </div>
            ) : (
              data.overview && (
                <motion.p
                  className="mt-4 leading-relaxed text-neutral-200 font-space-grotesk"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease }}
                >
                  {data.overview}
                </motion.p>
              )
            )}

            {!isPreviewOnly && (
              <>
                <div className="mt-6">
                  <h2 className="text-sm uppercase tracking-wide text-neutral-400 font-space-grotesk">
                    Streaming
                  </h2>
                  {getUSProviders(data)?.flatrate?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getUSProviders(data)!.flatrate!.slice(0, 8).map((provider) => (
                        <span
                          key={`stream-${provider.provider_id}`}
                          className="rounded-4xl border-t border-neutral-600 bg-neutral-800/80 px-3 py-1 text-sm text-neutral-200 font-space-grotesk"
                        >
                          {provider.provider_name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-neutral-500 font-space-grotesk">
                      No streaming provider data available.
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  <h2 className="text-sm uppercase tracking-wide text-neutral-400 font-space-grotesk">
                    Cast
                  </h2>
                  {getCast(data).length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getCast(data).map((person) => (
                        <span
                          key={`cast-${person.id}`}
                          className="rounded-4xl border-t border-neutral-600 bg-neutral-800/80 px-3 py-1 text-sm text-neutral-200 font-space-grotesk"
                        >
                          {person.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-neutral-500 font-space-grotesk">
                      No cast data available.
                    </p>
                  )}
                </div>
              </>
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
                  void (isDisliked ? actions.undislike() : actions.dislike());
                }}
                className={`${pill} ${isDisliked ? "bg-green-500/80 border-green-400 text-white" : "text-neutral-300 hover:text-white"}`}
                title={isDisliked ? "Remove dislike" : "Dislike"}
                whileTap={{ scale: 0.93 }}
              >
                <ThumbsDown
                  size={20}
                  strokeWidth={2.5}
                  fill={isDisliked ? "currentColor" : "none"}
                />
              </motion.button>
              <motion.button
                onClick={() => {
                  void (isLiked ? actions.unlike() : actions.like());
                }}
                className={`${pill} ${isLiked ? "bg-green-500/80 border-green-400 text-white" : "text-neutral-300 hover:text-white"}`}
                title={isLiked ? "Remove like" : "Like"}
                whileTap={{ scale: 0.93 }}
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
          onClick={() => {
            void (isSaved ? actions.unsave() : actions.save());
          }}
          className={`${pill} ${isSaved ? "bg-amber-500/80 border-amber-400 text-white" : "text-neutral-300 hover:text-white"}`}
          title={isSaved ? "Unsave" : "Save"}
          whileTap={{ scale: 0.93 }}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Bookmark size={20} strokeWidth={2.5} fill={isSaved ? "currentColor" : "none"} />
        </motion.button>

        <motion.button
          onClick={() => navigate(-1)}
          className={`${pill} text-neutral-300 hover:text-white`}
          title="Back"
          whileTap={{ scale: 0.93 }}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
};

export default DetailPage;
