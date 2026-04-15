import { useSavedList } from "../../hooks/useMedia";
import MediaCard from "../Discovery/MediaCard";

const SavedPage = () => {
  const { data: saved, isLoading, isError, error } = useSavedList();

  if (isLoading && !saved?.length) {
    return (
      <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="aspect-2/3 w-full rounded-4xl bg-neutral-800/70 animate-pulse" />
        ))}
      </div>
    );
  }
  if (isError) return <p className="p-5 text-red-400">Error: {error?.message}</p>;

  if (!saved?.length)
    return (
      <div className="p-5">
        <p className="text-neutral-400">
          No saved items yet. Tap the bookmark on any movie or show's detail page.
        </p>
      </div>
    );

  return (
    <div>
      <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5">
        {saved.map((item) => (
          <MediaCard key={`${item.media_type}-${item.id}`} item={item} isSaved />
        ))}
      </div>
    </div>
  );
};

export default SavedPage;
