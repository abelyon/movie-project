import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { fetchPerson } from "../../api/tmdb";
import type { MediaItem } from "../../api/types";
import { AnimatedNavIcon } from "../../components/AnimatedNavIcon";
import MediaCard from "../Discovery/MediaCard";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const ease = [0.25, 0.46, 0.45, 0.94] as const;
const enterFast = { duration: 0.22, ease } as const;
const pill =
  "flex items-center justify-center bg-neutral-800/80 border-t border-neutral-600  backdrop-blur-md rounded-4xl p-4 cursor-pointer transition-colors";
const actionButtonInactive = "text-neutral-400";

const PersonPosterBlock = ({ image, name }: { image: string; name: string }) => {
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
        src={image}
        alt={name}
        className="w-full h-50 object-cover rounded-4xl sm:h-full"
        decoding="async"
        fetchPriority="high"
        onLoad={() => setImageLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  );
};

const PersonDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const personId = Number.parseInt(id ?? "", 10);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["tmdb", "person", personId],
    queryFn: () => fetchPerson(personId),
    enabled: Number.isFinite(personId),
    staleTime: 5 * 60 * 1000,
  });

  const mediaItems: MediaItem[] = useMemo(
    () =>
      (data?.credits ?? []).map((item) => ({
        id: item.id,
        media_type: item.media_type,
        title: item.title,
        name: item.name,
        poster_path: item.poster_path ?? null,
        backdrop_path: item.backdrop_path ?? null,
        overview: item.overview,
        vote_average: item.vote_average,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
      })),
    [data?.credits],
  );

  if (isLoading) {
    return <div className="p-5 text-neutral-300">Loading person details...</div>;
  }

  if (isError) {
    return (
      <div className="p-5 text-red-300">
        Failed to load person: {(error as Error).message}
      </div>
    );
  }

  if (!data) {
    return <div className="p-5 text-neutral-300">Person not found.</div>;
  }

  const poster = data.profile_path
    ? `${TMDB_IMAGE_BASE_URL}${data.profile_path}`
    : "https://placehold.co/500x750/171717/a3a3a3?text=No+Photo";

  return (
    <div className="text-white overflow-hidden">
      <div className="relative z-10 mx-auto max-w-4xl px-5 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <PersonPosterBlock image={poster} name={data.name} />

          <motion.div
            className="min-w-0 flex-1"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={enterFast}
          >
            <div className="flex items-start justify-between gap-3">
              <h1 className="wrap-break-word text-3xl font-space-grotesk font-bold">{data.name}</h1>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="text-sm font-space-grotesk font-medium text-neutral-400 bg-neutral-800/80 border-t border-neutral-600 px-3 py-1 rounded-4xl">
                {data.known_for_department ?? "Person"}
              </span>
              {data.birthday && (
                <span className="text-sm font-space-grotesk font-medium text-neutral-400 bg-neutral-800/80 border-t border-neutral-600 px-3 py-1 rounded-4xl">
                  {data.birthday}
                </span>
              )}
              {data.place_of_birth && (
                <span className="text-sm font-space-grotesk font-medium text-neutral-400 bg-neutral-800/80 border-t border-neutral-600 px-3 py-1 rounded-4xl">
                  {data.place_of_birth}
                </span>
              )}
            </div>

            {data.biography && (
              <motion.p
                className="mt-4 leading-relaxed text-neutral-200 font-space-grotesk"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease }}
              >
                {data.biography}
              </motion.p>
            )}
          </motion.div>
        </div>

        {mediaItems.length === 0 && (
          <p className="mt-8 text-sm text-neutral-400">No movie or TV credits found.</p>
        )}
      </div>

      {mediaItems.length > 0 && (
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5">
          {mediaItems.map((item) => (
            <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
          ))}
        </div>
      )}

      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-3">
        <motion.button
          type="button"
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

export default PersonDetailPage;
