import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { fetchPerson } from "../../api/tmdb";
import type { MediaItem } from "../../api/types";
import MediaCard from "../Discovery/MediaCard";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

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

  return (
    <div className="p-5">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-neutral-600 bg-neutral-800/70 px-3 py-2 text-sm text-neutral-100 transition hover:bg-neutral-700/70"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-neutral-700 bg-neutral-800/50 p-4 md:flex-row md:items-start">
        <img
          src={data.profile_path ? `${TMDB_IMAGE_BASE_URL}${data.profile_path}` : "https://placehold.co/500x750/171717/a3a3a3?text=No+Photo"}
          alt={data.name}
          className="h-48 w-36 rounded-2xl object-cover"
        />
        <div className="min-w-0">
          <h1 className="text-2xl font-space-grotesk font-semibold text-neutral-100">{data.name}</h1>
          <p className="mt-1 text-sm text-neutral-300">{data.known_for_department ?? "Person"}</p>
          {(data.birthday || data.place_of_birth) && (
            <p className="mt-1 text-sm text-neutral-400">
              {[data.birthday, data.place_of_birth].filter(Boolean).join(" • ")}
            </p>
          )}
          {data.biography && (
            <p className="mt-3 max-h-28 overflow-auto text-sm text-neutral-300">{data.biography}</p>
          )}
        </div>
      </div>

      <h2 className="px-1 text-lg font-space-grotesk font-medium text-neutral-100">Media</h2>
      {mediaItems.length === 0 ? (
        <p className="px-1 pt-2 text-sm text-neutral-400">No movie or TV credits found.</p>
      ) : (
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5">
          {mediaItems.map((item) => (
            <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default PersonDetailPage;
