import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import type { MediaItem } from "../../api/types";
import { getState, stateKey } from "../../api/userMedia";
import { Bookmark, Clapperboard, Star, Tv } from "lucide-react";
import { detailQueryKey, fetchDetail } from "../../hooks/useDetail";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

type WatchTogetherMeta = {
  wantCount: number;
  participantCount: number;
  wantedByNames: string[];
};

const MediaCard = ({
  item,
  isSaved = false,
  watchTogetherMeta,
}: {
  item: MediaItem;
  isSaved?: boolean;
  watchTogetherMeta?: WatchTogetherMeta;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const prefetchDetail = () => {
    const mt = item.media_type;
    if (mt !== "movie" && mt !== "tv") return;
    const kind = mt as "movie" | "tv";
    void queryClient.prefetchQuery({
      queryKey: detailQueryKey(kind, item.id),
      queryFn: () => fetchDetail(kind, item.id),
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
        queryKey: detailQueryKey(item.media_type, item.id),
        queryFn: () => fetchDetail(item.media_type as "movie" | "tv", item.id),
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
  };

  return (
    <motion.div
      onClick={() => {
        void openDetail();
      }}
      onMouseEnter={prefetchForDetail}
      onFocus={prefetchForDetail}
      onTouchStart={prefetchForDetail}
      className="relative m-auto flex flex-col items-center justify-center rounded-4xl cursor-pointer aspect-2/3 w-full"
      initial={{ opacity: 1, y: 0, scale: 1 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: false, amount: 0.15, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative w-full h-full wmin-h-[280px] overflow-hidden rounded-4xl bg-neutral-800/80">
        <motion.img
          src={`${TMDB_IMAGE_BASE_URL}${item.poster_path ?? ""}`}
          alt={item.title ?? item.name ?? ""}
          className="w-full h-full object-cover"
          onLoad={() => setImageLoaded(true)}
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className="absolute inset-0 rounded-4xl bg-neutral-800/90"
          initial={false}
          animate={{ opacity: imageLoaded ? 0 : 1 }}
          transition={{ duration: 0.25 }}
          style={{ pointerEvents: "none" }}
        >
          <motion.div
            className="absolute inset-0 rounded-4xl bg-linear-to-r from-transparent via-neutral-600/30 to-transparent"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            style={{ width: "60%", willChange: "transform" }}
          />
        </motion.div>
      </div>
      <div className="absolute top-0 left-0 p-4 flex justify-between w-full pointer-events-none">
        <span className="flex items-center h-9 bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md px-3 py-2 rounded-4xl text-neutral-100">
          {item.media_type === "movie" ? (
            <Clapperboard size={20} strokeWidth={2.5} />
          ) : item.media_type === "tv" ? (
            <Tv size={20} strokeWidth={2.5} />
          ) : null}
        </span>
        {item.vote_average != null && item.vote_average > 0 && (
          <span className="flex items-center h-9 bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md px-3 py-2 rounded-4xl text-neutral-100 font-space-grotesk font-medium text-md">
            {item.vote_average.toFixed(1)}
          </span>
        )}
      </div>
      {isSaved && (
        <div className="absolute bottom-0 right-0 p-4">
          <span className="flex items-center h-9 bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md px-3 py-2 rounded-4xl text-white">
            <Bookmark size={20} strokeWidth={2.5} fill="currentColor" />
          </span>
        </div>
      )}
      {watchTogetherMeta && watchTogetherMeta.participantCount > 0 && (
        <div className="absolute bottom-0 right-0 p-4 flex flex-col items-start gap-2 pointer-events-none">
          {watchTogetherMeta.wantCount >= watchTogetherMeta.participantCount ? (
            <span
              title="Everyone wants to watch"
              className="flex items-center justify-center h-9 min-w-[44px] bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md px-3 py-2 rounded-4xl text-neutral-100"
            >
              <Star size={20} strokeWidth={2.5} fill="currentColor" />
            </span>
          ) : (
            <span
              title={`${watchTogetherMeta.wantCount} selected user(s) want to watch`}
              className="flex items-center justify-center h-9 min-w-[44px] bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md px-3 py-2 rounded-4xl text-neutral-100 font-space-grotesk font-medium text-md"
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
