import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import type { MediaItem } from "../../api/types";
import { getState, stateKey } from "../../api/userMedia";
import { Bookmark, Clapperboard, Star, Tv } from "lucide-react";
import { detailQueryKey, fetchDetail } from "../../hooks/useDetail";
import { useAuth } from "../../contexts/AuthContext";
import {
  mediaBadgePosterClass,
  mediaBadgePosterIconSize,
  mediaBadgePosterOverlayPadding,
  mediaBadgePosterScoreClass,
} from "../../constants/mediaBadges";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const NO_PHOTO_PLACEHOLDER =
  "https://placehold.co/500x750/171717/a3a3a3?text=No+Photo";

type WatchTogetherMeta = {
  wantCount: number;
  participantCount: number;
  wantedByNames: string[];
};

const MediaCard = ({
  item,
  isSaved = false,
  watchTogetherMeta,
  scrollToTopOnOpen = false,
  eager = false,
  onImageSettled,
  rounded = "4xl",
}: {
  item: MediaItem;
  isSaved?: boolean;
  watchTogetherMeta?: WatchTogetherMeta;
  scrollToTopOnOpen?: boolean;
  eager?: boolean;
  onImageSettled?: () => void;
  rounded?: "3xl" | "4xl";
}) => {
  const cardRounded = rounded === "3xl" ? "rounded-3xl" : "rounded-4xl";
  const { user } = useAuth();
  const watchRegion = user?.country_code && user.country_code.length === 2
    ? user.country_code.toUpperCase()
    : "US";
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(
    item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : NO_PHOTO_PLACEHOLDER,
  );

  // Notify the parent at most once, when this card's image has finished
  // resolving (loaded or failed), so the grid can reveal the batch together.
  const settledRef = useRef(false);
  const settle = useCallback(() => {
    if (settledRef.current) return;
    settledRef.current = true;
    onImageSettled?.();
  }, [onImageSettled]);

  useLayoutEffect(() => {
    const img = imageRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setImageLoaded(true);
      settle();
    }
  }, [imageSrc, settle]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const everyoneWantsToWatch = Boolean(
    watchTogetherMeta &&
    watchTogetherMeta.participantCount > 0 &&
    watchTogetherMeta.wantCount >= watchTogetherMeta.participantCount,
  );

  const showWatchTogetherBadge = Boolean(
    watchTogetherMeta &&
    watchTogetherMeta.participantCount > 0 &&
    (everyoneWantsToWatch || watchTogetherMeta.wantCount >= 2),
  );

  const prefetchDetail = () => {
    const mt = item.media_type;
    if (mt !== "movie" && mt !== "tv") return;
    const kind = mt as "movie" | "tv";
    void queryClient.prefetchQuery({
      queryKey: detailQueryKey(kind, item.id, watchRegion),
      queryFn: () => fetchDetail(kind, item.id, watchRegion),
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchUserMediaState = () => {
    const mt = item.media_type;
    if (mt !== "movie" && mt !== "tv") return;
    void queryClient.prefetchQuery({
      queryKey: ["user", "media", "state", stateKey(item.id, mt)],
      queryFn: async () => {
        const map = await getState([{ id: item.id, media_type: mt }]);
        return map[stateKey(item.id, mt)] ?? {
          is_saved: false,
          is_liked: false,
          is_disliked: false,
          is_favorited: false,
          watched_at: null,
        };
      },
      staleTime: 30_000,
    });
  };

  const prefetchForDetail = () => {
    prefetchDetail();
    prefetchUserMediaState();
  };

  const openDetail = async () => {
    prefetchForDetail();
    await Promise.allSettled([
      queryClient.ensureQueryData({
        queryKey: detailQueryKey(item.media_type, item.id, watchRegion),
        queryFn: () =>
          fetchDetail(item.media_type as "movie" | "tv", item.id, watchRegion),
        staleTime: 5 * 60 * 1000,
      }),
      queryClient.ensureQueryData({
        queryKey: ["user", "media", "state", stateKey(item.id, item.media_type)],
        queryFn: async () => {
          const map = await getState([{ id: item.id, media_type: item.media_type }]);
          return map[stateKey(item.id, item.media_type)] ?? {
            is_saved: false,
            is_liked: false,
            is_disliked: false,
            is_favorited: false,
            watched_at: null,
          };
        },
        staleTime: 30_000,
      }),
    ]);
    navigate(`/${item.media_type}/${item.id}`, { state: { preview: item } });
    if (scrollToTopOnOpen) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  return (
    <motion.div
      onClick={() => {
        void openDetail();
      }}
      onMouseEnter={prefetchForDetail}
      onFocus={prefetchForDetail}
      onTouchStart={prefetchForDetail}
      className={`relative m-auto flex flex-col items-center justify-center ${cardRounded} overflow-hidden cursor-pointer aspect-2/3 w-full ${
        everyoneWantsToWatch ? "border-y-2 border-white" : ""
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`relative h-full w-full overflow-hidden ${cardRounded} bg-neutral-800/80`}>
        <img
          ref={imageRef}
          src={imageSrc}
          alt={item.title ?? item.name ?? ""}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => {
            setImageLoaded(true);
            settle();
          }}
          onError={() => {
            if (imageSrc !== NO_PHOTO_PLACEHOLDER) {
              setImageLoaded(false);
              setImageSrc(NO_PHOTO_PLACEHOLDER);
            } else {
              // Placeholder also failed; unblock the batch reveal anyway.
              settle();
            }
          }}
        />
        {!imageLoaded && (
          <motion.div
            className={`absolute inset-0 ${cardRounded} bg-neutral-800/90`}
            style={{ pointerEvents: "none" }}
          >
            <motion.div
              className={`absolute inset-0 ${cardRounded} bg-linear-to-r from-transparent via-neutral-600/30 to-transparent`}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              style={{ width: "60%", willChange: "transform" }}
            />
          </motion.div>
        )}
      </div>
      <div className={`pointer-events-none absolute top-0 left-0 flex w-full justify-between ${mediaBadgePosterOverlayPadding}`}>
        <span className={mediaBadgePosterClass}>
          {item.media_type === "movie" ? (
            <Clapperboard size={mediaBadgePosterIconSize} strokeWidth={2.5} />
          ) : item.media_type === "tv" ? (
            <Tv size={mediaBadgePosterIconSize} strokeWidth={2.5} />
          ) : null}
        </span>
        {item.vote_average != null && item.vote_average > 0 && (
          <span className={`${mediaBadgePosterClass} ${mediaBadgePosterScoreClass}`}>
            {item.vote_average.toFixed(1)}
          </span>
        )}
      </div>
      {isSaved && (
        <div className={`absolute right-0 bottom-0 ${mediaBadgePosterOverlayPadding}`}>
          <span className={mediaBadgePosterClass}>
            <Bookmark size={mediaBadgePosterIconSize} strokeWidth={2.5} fill="currentColor" />
          </span>
        </div>
      )}
      {watchTogetherMeta && showWatchTogetherBadge && (
        <div className={`pointer-events-none absolute right-0 bottom-0 flex flex-col items-start gap-2 ${mediaBadgePosterOverlayPadding}`}>
          {watchTogetherMeta.wantCount >= watchTogetherMeta.participantCount ? (
            <span
              title="Everyone wants to watch"
              className={`${mediaBadgePosterClass} border-white text-neutral-100`}
            >
              <Star size={mediaBadgePosterIconSize} strokeWidth={2.5} fill="currentColor" />
            </span>
          ) : (
            <span
              title={`${watchTogetherMeta.wantCount} selected user(s) want to watch`}
              className={`${mediaBadgePosterClass} ${mediaBadgePosterScoreClass}`}
            >
              {watchTogetherMeta.wantCount}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default MediaCard;
