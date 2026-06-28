import { Fragment, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useDetail } from "../../hooks/useDetail";
import {
  useMediaState,
  useMediaActions,
  mediaItemFromDetail,
  useSavedList,
} from "../../hooks/useMedia";
import {
  type MediaDetail,
  type MovieDetail,
  type TvDetail,
} from "../../api/tmdb";
import {
  ArrowLeft,
  Bookmark,
  Clapperboard,
  Eye,
  Heart,
  Play,
  ThumbsDown,
  ThumbsUp,
  Tv,
} from "lucide-react";
import type { MediaItem } from "../../api/types";
import { previewItemToDetail } from "../../utils/detailPreview";
import { providerMediaBrowseUrl } from "../../utils/streamingProviderLinks";
import { AnimatedNavIcon } from "../../components/AnimatedNavIcon";
import { getFriendOverview } from "../../api/friends";
import { useAuth } from "../../contexts/AuthContext";
import { getWhoWantsToWatch, stateKey } from "../../api/userMedia";
import MediaCard from "../Discovery/MediaCard";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const BACKDROP_SIZE = "w1280";
const PROFILE_SIZE = "w185";
const PROVIDER_LOGO_SIZE = "w92";

const FRIEND_CHIP_COLORS = [
  "#fb2c36",
  "#00c950",
  "#ad46ff",
  "#2b7fff",
  "#f0b100",
  "#ff6900",
] as const;

const MAX_VISIBLE_FRIEND_CHIPS = 9;

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

const formatRuntimeMinutes = (minutes: number): string => {
  if (minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

const getSeasonsLabel = (detail: MediaDetail, mediaType: string): string | undefined => {
  if (mediaType !== "tv") return undefined;
  const seasons = (detail as TvDetail).number_of_seasons;
  return seasons != null && seasons > 0
    ? `${seasons} season${seasons === 1 ? "" : "s"}`
    : undefined;
};

const getUSProviders = (detail: MediaDetail) => detail.watch_providers;

const getWatchProvidersPageUrl = (detail: MediaDetail): string | null => {
  const link = detail.watch_providers?.link;
  return typeof link === "string" && link.trim() !== "" ? link.trim() : null;
};

const getCast = (detail: MediaDetail) =>
  (detail.cast ?? []).slice(0, 12).filter((p) => p?.name);

const getTrailerYoutubeKey = (detail: MediaDetail): string | null | undefined =>
  detail.trailer_youtube_key;

const getRecommendations = (detail: MediaDetail): MediaItem[] =>
  Array.isArray(detail.recommendations) ? detail.recommendations : [];

const formatVoteDisplay = (vote: number | null | undefined): string | null => {
  if (vote == null || vote <= 0) return null;
  return String(Math.round(vote * 10));
};

const userInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return [...name.trim()].slice(0, 2).join("").toUpperCase() || "?";
};

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const enterFast = { duration: 0.22, ease } as const;

const pill =
  "flex items-center justify-center bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md rounded-4xl p-4 cursor-pointer transition-colors";
const actionButtonInactive = "text-neutral-400";
const actionButtonActive = "text-neutral-100";

const heroBadgeClass =
  "flex h-10 min-w-[60px] items-center justify-center rounded-[42px] border-t border-neutral-600 bg-neutral-800/80 px-4 py-2 backdrop-blur-md";

const genrePillClass =
  "flex h-10 shrink-0 items-center justify-center rounded-[26px] border-t border-neutral-600 bg-neutral-800/80 px-4 py-2 font-space-grotesk text-base font-bold text-neutral-300";

function SectionHeader({
  title,
  action,
  emphasized = false,
}: {
  title: string;
  action?: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-between">
      <h2
        className={`font-space-grotesk text-2xl uppercase text-neutral-100 ${
          emphasized ? "font-extrabold" : "font-bold"
        }`}
      >
        {title}
      </h2>
      {action}
    </div>
  );
}

function MetadataDot() {
  return <span className="size-1 shrink-0 rounded-[2px] bg-neutral-300" aria-hidden />;
}

function CastPill({
  person,
  onSelect,
}: {
  person: {
    id: number;
    name: string;
    character?: string;
    profile_path?: string | null;
  };
  onSelect: () => void;
}) {
  const imageSrc = person.profile_path
    ? `${TMDB_IMAGE_BASE}/${PROFILE_SIZE}${person.profile_path}`
    : "https://placehold.co/180x180/262626/a3a3a3?text=?";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex shrink-0 items-center gap-5 rounded-[30px] bg-neutral-800 pr-6 text-left"
    >
      <img
        src={imageSrc}
        alt=""
        className="size-[90px] shrink-0 rounded-l-[30px] object-cover"
        loading="lazy"
        decoding="async"
      />
      <div className="flex flex-col gap-2 py-2">
        <p className="whitespace-nowrap font-space-grotesk text-base font-bold text-neutral-100">
          {person.name}
        </p>
        {person.character ? (
          <p className="whitespace-nowrap font-space-grotesk text-sm font-bold text-neutral-400">
            {person.character}
          </p>
        ) : null}
      </div>
    </button>
  );
}

type DetailLocationState = { preview?: MediaItem };

const DetailPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { media_type, id } = useParams<{ media_type: string; id: string }>();
  const numericId = id ? parseInt(id, 10) : NaN;
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  useEffect(() => {
    setSynopsisExpanded(false);
  }, [media_type, id]);

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
    user?.country_code,
  );
  const data = fetched ?? previewDetail;
  const showSkeleton = isPending && !data;
  const isPreviewOnly = !fetched && !!previewDetail;

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
  const { data: savedList } = useSavedList();
  const savedSet = useMemo(
    () => new Set((savedList ?? []).map((item) => stateKey(item.id, item.media_type))),
    [savedList],
  );

  const recommendationItems = useMemo(() => {
    if (!data) return [];
    return getRecommendations(data).filter(
      (r) => r.media_type === "movie" || r.media_type === "tv",
    );
  }, [data]);

  const wantChips = useMemo(() => {
    const ids = whoWants.data?.want_friend_user_ids ?? [];
    const friendNameById = new Map<number, string>();
    for (const friend of friendsOverview.data?.friends ?? []) {
      friendNameById.set(friend.id, friend.name);
    }
    return ids.map((userId) => {
      const friendName = friendNameById.get(userId);
      const displayName = friendName ?? `User ${userId}`;
      return { userId, displayName, initialFrom: displayName };
    });
  }, [whoWants.data?.want_friend_user_ids, friendsOverview.data?.friends]);

  if (!media_type || !id)
    return <div className="p-5 text-neutral-400">Invalid route</div>;

  if (showSkeleton) {
    return (
      <div className="overflow-hidden text-white">
        <div className="h-[290px] animate-pulse bg-neutral-800/80" />
        <div className="flex flex-col gap-9 px-5 py-9">
          <div className="flex gap-5">
            <div className="h-10 w-32 rounded-[26px] bg-neutral-800/80 animate-pulse" />
            <div className="h-10 w-24 rounded-[26px] bg-neutral-800/80 animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-7 w-28 rounded bg-neutral-800/80 animate-pulse" />
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="size-[41px] rounded-full bg-neutral-800/80 animate-pulse" />
              ))}
            </div>
          </div>
          <div className="h-4 w-full rounded bg-neutral-800/80 animate-pulse" />
          <div className="h-4 w-[92%] rounded bg-neutral-800/80 animate-pulse" />
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
  const backdropPath = fetched?.backdrop_path ?? data.backdrop_path;
  const heroImage = backdropPath
    ? `${TMDB_IMAGE_BASE}/${BACKDROP_SIZE}${backdropPath}`
    : null;
  const trailerKey = getTrailerYoutubeKey(data);
  const trailerUrl = trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : null;
  const trailerBackdrop = backdropPath
    ? `${TMDB_IMAGE_BASE}/${BACKDROP_SIZE}${backdropPath}`
    : null;
  const voteDisplay = formatVoteDisplay(data.vote_average);
  const durationLabel =
    media_type === "movie" && runtime != null && runtime > 0
      ? formatRuntimeMinutes(runtime)
      : media_type === "tv"
        ? seasonsLabel
        : undefined;

  const isSaved = userState?.is_saved ?? false;
  const isLiked = userState?.is_liked ?? false;
  const isDisliked = userState?.is_disliked ?? false;
  const isFavorited = userState?.is_favorited ?? false;
  const isWatched = Boolean(userState?.watched_at);
  const showFriendsSection = wantChips.length > 0;
  const visibleFriendChips = wantChips.slice(0, MAX_VISIBLE_FRIEND_CHIPS);
  const overflowFriendCount = Math.max(0, wantChips.length - MAX_VISIBLE_FRIEND_CHIPS);
  const cast = getCast(data);
  const providers = getUSProviders(data)?.flatrate ?? [];
  const metadataParts = [date ? date.slice(0, 4) : null, durationLabel].filter(
    (part): part is string => Boolean(part),
  );

  return (
    <div className="overflow-hidden text-white">
      <section className="relative h-[290px] w-full overflow-hidden">
        {heroImage ? (
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            decoding="async"
            fetchPriority="high"
          />
        ) : (
          <div className="absolute inset-0 bg-neutral-800" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-b from-neutral-500/0 via-neutral-900/20 to-neutral-900"
          style={{ backgroundImage: "linear-gradient(to bottom, rgba(125,125,125,0) 0%, #171717 86.5%)" }}
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className={heroBadgeClass}>
              {media_type === "movie" ? (
                <Clapperboard size={20} strokeWidth={2.5} className="text-neutral-100" />
              ) : (
                <Tv size={20} strokeWidth={2.5} className="text-neutral-100" />
              )}
            </span>
            {voteDisplay ? (
              <span className={`${heroBadgeClass} font-space-grotesk text-xl font-bold text-neutral-100`}>
                {voteDisplay}
              </span>
            ) : null}
          </div>

          <motion.div
            className="flex flex-col items-center gap-2.5 text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={enterFast}
          >
            <h1 className="font-space-grotesk text-[32px] font-bold uppercase leading-tight text-neutral-100">
              {title}
            </h1>
            {(metadataParts.length > 0) && (
              <div className="flex items-center justify-center gap-5 font-space-grotesk text-xl font-bold text-neutral-300">
                {metadataParts.map((part, index) => (
                  <Fragment key={`${part}-${index}`}>
                    {index > 0 ? <MetadataDot /> : null}
                    <span>{part}</span>
                  </Fragment>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      <motion.main
        className="flex flex-col gap-9 px-5 pt-9"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={enterFast}
      >
        {Boolean(data.genres?.length) && (
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="mx-auto flex w-max items-center gap-5 pb-1">
              {(data.genres ?? []).map((genre) => (
                <span key={genre.id} className={genrePillClass}>
                  {genre.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {showFriendsSection && (
          <section className="flex flex-col gap-3">
            <SectionHeader title="Friends" />
            <div className="flex items-center">
              {visibleFriendChips.map(({ userId, initialFrom }, index) => (
                <div
                  key={userId}
                  className="relative flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-neutral-900"
                  style={{
                    backgroundColor: FRIEND_CHIP_COLORS[index % FRIEND_CHIP_COLORS.length],
                    marginRight: index < visibleFriendChips.length - 1 || overflowFriendCount > 0 ? -4 : 0,
                    zIndex: visibleFriendChips.length - index,
                  }}
                  title={initialFrom}
                >
                  <span className="font-space-grotesk text-base font-extrabold leading-none tracking-wide text-white">
                    {userInitials(initialFrom)}
                  </span>
                </div>
              ))}
              {overflowFriendCount > 0 ? (
                <div
                  className="relative z-0 flex size-14 shrink-0 items-center justify-center rounded-full border-2 border-neutral-900 bg-neutral-800"
                  title={`${overflowFriendCount} more`}
                >
                  <span className="font-space-grotesk text-base font-extrabold leading-none tracking-wide text-neutral-300">
                    +{overflowFriendCount}
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        )}

        {!isPreviewOnly && (
          <>
            {providers.length > 0 && (
              <section className="flex flex-col gap-3">
                <SectionHeader title="Streaming" />
                <div className="flex flex-wrap gap-2">
                  {providers.slice(0, 8).map((provider) => {
                    const serviceUrl = providerMediaBrowseUrl(provider.provider_id, title);
                    const tmdbWatchUrl = getWatchProvidersPageUrl(data);
                    const href = serviceUrl ?? tmdbWatchUrl;
                    const inner = provider.logo_path ? (
                      <img
                        src={`${TMDB_IMAGE_BASE}/${PROVIDER_LOGO_SIZE}${provider.logo_path}`}
                        alt=""
                        className="size-[45px] rounded-xl object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="size-[45px] rounded-xl bg-neutral-700" />
                    );
                    return href ? (
                      <a
                        key={`stream-${provider.provider_id}`}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl transition hover:opacity-80"
                        title={provider.provider_name}
                        aria-label={`${provider.provider_name}: open in a new tab`}
                      >
                        {inner}
                      </a>
                    ) : (
                      <div
                        key={`stream-${provider.provider_id}`}
                        className="rounded-xl"
                        title={provider.provider_name}
                      >
                        {inner}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {data.overview && (
              <section className="flex flex-col gap-3">
                <SectionHeader title="Synopsis" emphasized />
                <p
                  className={`font-space-grotesk font-medium leading-relaxed text-neutral-300 ${
                    synopsisExpanded ? "" : "line-clamp-3"
                  } ${!synopsisExpanded ? "cursor-pointer" : ""}`}
                  onDoubleClick={() => setSynopsisExpanded((prev) => !prev)}
                  title={synopsisExpanded ? undefined : "Double-click to read more"}
                >
                  {data.overview}
                </p>
              </section>
            )}

            <section className="flex flex-col gap-3">
              <SectionHeader title="Cast" emphasized />
              {cast.length ? (
                <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex gap-5 pb-1">
                    {cast.map((person) => (
                      <CastPill
                        key={`cast-${person.id}`}
                        person={person}
                        onSelect={() => navigate(`/person/${person.id}`)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500 font-space-grotesk">
                  No cast data available.
                </p>
              )}
            </section>

            {trailerUrl ? (
              <section className="flex flex-col gap-3">
                <SectionHeader title="Trailers" />
                <a
                  href={trailerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative block aspect-[373/186] w-full overflow-hidden rounded-3xl bg-neutral-800 xl:max-w-xl"
                  aria-label={`Open ${title} trailer on YouTube`}
                >
                  {trailerBackdrop ? (
                    <img
                      src={trailerBackdrop}
                      alt=""
                      className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-black/35 transition group-hover:bg-black/45" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/60 bg-black/55 text-white shadow-lg backdrop-blur-sm transition group-hover:bg-black/70">
                      <Play size={26} fill="currentColor" strokeWidth={1.5} />
                    </span>
                  </div>
                </a>
              </section>
            ) : null}

            {recommendationItems.length > 0 ? (
              <section className="flex flex-col gap-3">
                <SectionHeader title="More like this" />
                <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex gap-5 pb-1">
                    {recommendationItems.map((item) => (
                      <div key={`reco-${item.media_type}-${item.id}`} className="w-44 shrink-0">
                        <MediaCard
                          item={item}
                          isSaved={savedSet.has(stateKey(item.id, item.media_type))}
                          scrollToTopOnOpen
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}
          </>
        )}

        {isPreviewOnly && (data.overview || isFetching) && (
          <section className="flex flex-col gap-3">
            <SectionHeader title="Synopsis" emphasized />
            {isFetching ? (
              <div className="space-y-2" aria-hidden>
                <div className="h-4 w-full rounded bg-neutral-800/70 animate-pulse" />
                <div className="h-4 w-[92%] rounded bg-neutral-800/70 animate-pulse" />
                <div className="h-4 w-[85%] rounded bg-neutral-800/70 animate-pulse" />
              </div>
            ) : data.overview ? (
              <p
                className={`font-space-grotesk font-medium leading-relaxed text-neutral-300 ${
                  synopsisExpanded ? "" : "line-clamp-3"
                } ${!synopsisExpanded ? "cursor-pointer" : ""}`}
                onDoubleClick={() => setSynopsisExpanded((prev) => !prev)}
                title={synopsisExpanded ? undefined : "Double-click to read more"}
              >
                {data.overview}
              </p>
            ) : null}
          </section>
        )}
      </motion.main>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-center gap-3">
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
