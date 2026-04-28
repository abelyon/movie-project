import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useDetail } from "../../hooks/useDetail";
import { useMediaState, useMediaActions, mediaItemFromDetail } from "../../hooks/useMedia";
import type { MediaDetail, MovieDetail, TvDetail } from "../../api/tmdb";
import { ArrowLeft, Bookmark, Clapperboard, Eye, Heart, ThumbsDown, ThumbsUp, Tv } from "lucide-react";
import type { MediaItem } from "../../api/types";
import { previewItemToDetail } from "../../utils/detailPreview";
import { AnimatedNavIcon } from "../../components/AnimatedNavIcon";
import { getFriendOverview } from "../../api/friends";
import { useAuth } from "../../contexts/AuthContext";
import { getWhoWantsToWatch } from "../../api/userMedia";
import { WatchTogetherUserStack } from "../../components/WatchTogetherUserStack";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const POSTER_SIZE = "w780";
const PROVIDER_LOGO_SIZE = "w92";
const CAST_PROFILE_SIZE = "w185";

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

const getUSProviders = (detail: MediaDetail) => detail.watch_providers;
const getCast = (detail: MediaDetail) =>
  (detail.cast ?? []).slice(0, 12).filter((p) => p?.name);

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const enterFast = { duration: 0.22, ease } as const;

const pill =
  "flex items-center justify-center bg-neutral-800/80 border-t border-neutral-600  backdrop-blur-md rounded-4xl p-4 cursor-pointer transition-colors";
const actionButtonInactive = "text-neutral-400";
const actionButtonActive = "text-neutral-100";

function DetailPosterBlock({
  poster,
  title,
  mediaType,
  voteAverage,
}: {
  poster: string;
  title: string;
  mediaType: string;
  voteAverage: number | null | undefined;
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
    </motion.div>
  );
}

type DetailLocationState = { preview?: MediaItem };

const DetailPage = () => {
  const { user } = useAuth();
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
  const whoWantsEnabled =
    !!user &&
    !Number.isNaN(numericId) &&
    (media_type === "movie" || media_type === "tv");
  const whoWants = useQuery({
    queryKey: ["user", "media", "who-wants-to-watch", media_type, numericId],
    queryFn: () => getWhoWantsToWatch(numericId, media_type!),
    staleTime: 30_000,
    enabled: whoWantsEnabled,
  });
  const friendsOverview = useQuery({
    queryKey: ["friends", "overview"],
    queryFn: getFriendOverview,
    staleTime: 60_000,
    enabled: !!user,
  });

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
  const isFavorited = userState?.is_favorited ?? false;
  const isWatched = Boolean(userState?.watched_at);
  const showWhoWantsToWatch =
    (whoWants.data?.want_friend_user_ids?.length ?? 0) > 0;
  const wantChips = useMemo(() => {
    const ids = whoWants.data?.want_user_ids ?? [];
    const friendNameById = new Map<number, string>();
    for (const friend of friendsOverview.data?.friends ?? []) {
      friendNameById.set(friend.id, friend.name);
    }
    return ids.map((userId) => {
      const isSelf = user && userId === user.id;
      const friendName = friendNameById.get(userId);
      const displayName = isSelf ? "You" : friendName ?? `User ${userId}`;
      const initialFrom = isSelf ? (user.name?.trim() || "You") : friendName ?? `User ${userId}`;
      return { userId, displayName, initialFrom };
    });
  }, [whoWants.data?.want_user_ids, friendsOverview.data?.friends, user]);

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
            />
          )}

          {/* Info */}
          <motion.div
            className="min-w-0 flex-1"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={enterFast}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-5">
                <h1 className="wrap-break-word text-3xl font-space-grotesk font-bold">{title}</h1>
              </div>
              {date && (
                <span className="text-xl font-space-grotesk font-bold text-neutral-400 shrink-0">
                  {date.slice(0, 4)}
                </span>
              )}
            </div>

            {(Boolean(data.genres?.length) ||
              Boolean(seasonsLabel) ||
              (media_type === "movie" && runtime != null && runtime > 0)) && (
              <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
                {Boolean(data.genres?.length) && (
                  <motion.p
                    className="flex min-w-0 flex-1 flex-wrap gap-2"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: { transition: { staggerChildren: 0.03, delayChildren: 0 } },
                    }}
                  >
                    {(data.genres ?? []).map((genre) => (
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
                {((media_type === "movie" && runtime != null && runtime > 0) ||
                  (media_type === "tv" && seasonsLabel)) && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, ease }}
                    className="shrink-0 text-base font-space-grotesk font-bold text-neutral-600"
                  >
                    {media_type === "movie" && runtime != null && runtime > 0
                      ? `${runtime} M`
                      : `${seasonsLabel} S`}
                  </motion.span>
                )}
              </div>
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

            {showWhoWantsToWatch && whoWants.data && (
              <div
                className={`mt-6 rounded-3xl border-t bg-neutral-800/80 p-4 ${
                  (whoWants.data.watch_want_count ?? 0) >= (whoWants.data.participant_count ?? 1)
                    ? "border-white"
                    : "border-neutral-600"
                }`}
              >
                <h2 className="font-space-grotesk text-sm font-semibold text-neutral-100">
                  Who wants to watch
                </h2>
                <p className="mt-1 text-sm text-neutral-300">
                  {(whoWants.data.watch_want_count ?? 0) >= (whoWants.data.participant_count ?? 1)
                    ? "Everyone in your group wants to watch this."
                    : `${whoWants.data.watch_want_count ?? 0}/${whoWants.data.participant_count ?? 0} in your group want to watch this.`}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {wantChips.length ? (
                    wantChips.map(({ userId, displayName, initialFrom }) => (
                      <div
                        key={userId}
                        className="flex w-20 shrink-0 flex-col items-center rounded-2xl px-2 py-2 text-neutral-300"
                      >
                        <WatchTogetherUserStack
                          initialFrom={initialFrom}
                          label={displayName}
                        />
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-400">No one marked interest yet.</span>
                  )}
                </div>
              </div>
            )}

            {!isPreviewOnly && (
              <>
                <div className="mt-6">
                  {getUSProviders(data)?.flatrate?.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getUSProviders(data)!.flatrate!.slice(0, 8).map((provider) => (
                        <div
                          key={`stream-${provider.provider_id}`}
                          className="rounded-2xl border-t border-neutral-600 bg-neutral-800/80 p-1.5"
                          title={provider.provider_name}
                        >
                          {provider.logo_path ? (
                            <img
                              src={`${TMDB_IMAGE_BASE}/${PROVIDER_LOGO_SIZE}${provider.logo_path}`}
                              alt={provider.provider_name}
                              className="h-8 w-8 rounded-lg object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-lg bg-neutral-700" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-neutral-500 font-space-grotesk">
                      No streaming provider data available.
                    </p>
                  )}
                </div>

                <div className="mt-6">
                  {getCast(data).length ? (
                    <div className="mt-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      <div className="flex gap-3 pb-1">
                        {getCast(data).map((person) => (
                          <div
                            key={`cast-${person.id}`}
                            className="w-36 shrink-0 rounded-3xl border-t border-neutral-600 bg-neutral-800/80 p-2"
                          >
                            {person.profile_path ? (
                              <img
                                src={`${TMDB_IMAGE_BASE}/${CAST_PROFILE_SIZE}${person.profile_path}`}
                                alt={person.name}
                                className="aspect-2/3 w-full rounded-2xl object-cover"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="aspect-2/3 w-full rounded-2xl bg-neutral-700" />
                            )}
                            <p className="mt-2 text-sm font-space-grotesk font-semibold text-neutral-100">
                              {person.name}
                            </p>
                            <p className="text-xs font-space-grotesk text-neutral-400">
                              {person.character || "—"}
                            </p>
                          </div>
                        ))}
                      </div>
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
        className="fixed bottom-5 right-5 z-50 flex flex-col items-center gap-3"
      >
        <AnimatePresence initial={false}>
          {isWatched && (
            <>
            <motion.button
              onClick={() => {
                void (isDisliked ? actions.undislike() : actions.dislike());
              }}
              className={`${pill} ${isDisliked ? actionButtonActive : actionButtonInactive}`}
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.18, ease }}
            >
              <AnimatedNavIcon>
                <ThumbsDown size={24} strokeWidth={2.5} />
              </AnimatedNavIcon>
            </motion.button>
            <motion.button
              onClick={() => {
                void (isLiked ? actions.unlike() : actions.like());
              }}
              className={`${pill} ${isLiked ? actionButtonActive : actionButtonInactive}`}
              initial={{ opacity: 0, scale: 0.92, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 8 }}
              transition={{ duration: 0.18, ease, delay: 0.03 }}
            >
              <AnimatedNavIcon>
                <ThumbsUp size={24} strokeWidth={2.5} />
              </AnimatedNavIcon>
            </motion.button>
            </>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => {
            void (isWatched ? actions.unwatched() : actions.watched());
          }}
          className={`${pill} ${isWatched ? actionButtonActive : actionButtonInactive}`}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatedNavIcon>
            <Eye size={24} strokeWidth={2.5} />
          </AnimatedNavIcon>
        </motion.button>

        <motion.button
          onClick={() => {
            void (isFavorited ? actions.unfavorite() : actions.favorite());
          }}
          className={`${pill} ${isFavorited ? actionButtonActive : actionButtonInactive}`}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatedNavIcon>
            <Heart size={24} strokeWidth={2.5} />
          </AnimatedNavIcon>
        </motion.button>

        <motion.button
          onClick={() => {
            void (isSaved ? actions.unsave() : actions.save());
          }}
          className={`${pill} ${isSaved ? actionButtonActive : actionButtonInactive}`}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatedNavIcon>
            <Bookmark size={24} strokeWidth={2.5} />
          </AnimatedNavIcon>
        </motion.button>

        <motion.button
          onClick={() => navigate(-1)}
          className={`${pill} ${actionButtonInactive}`}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatedNavIcon>
            <ArrowLeft size={24} strokeWidth={2.5} />
          </AnimatedNavIcon>
        </motion.button>
      </div>
    </div>
  );
};

export default DetailPage;
