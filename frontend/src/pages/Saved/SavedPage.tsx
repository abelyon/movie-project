import { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { stateKey } from "../../api/userMedia";
import { useMediaStateMap, useSavedList } from "../../hooks/useMedia";
import MediaCard from "../Discovery/MediaCard";
import type { MainLayoutOutletContext } from "../../layout/MainLayout";

const SavedPage = () => {
  const outletContext = useOutletContext<MainLayoutOutletContext | undefined>();
  const savedControls = outletContext?.savedControls ?? {
    sortBy: "default" as const,
    filterType: "all" as const,
    selectedGenreIds: [] as number[],
    minRating: 0 as const,
    yearFrom: "",
    selectedFriendIds: [] as number[],
    showFriendsSocial: false,
    withFriendsSaved: false,
  };
  const {
    sortBy,
    filterType,
    selectedGenreIds,
    minRating,
    yearFrom,
    selectedFriendIds,
    showFriendsSocial,
    withFriendsSaved,
  } = savedControls;

  const { data: saved, isLoading, isError, error } = useSavedList({
    withFriendsSaved,
    withFriendsSocial: showFriendsSocial,
    friendIds: selectedFriendIds,
  });

  /** In default Saved list, every row is the user's save — use for bookmark before state batch loads. */
  const userOnlySavedKeySet = useMemo(() => {
    if (withFriendsSaved || showFriendsSocial) return new Set<string>();
    return new Set((saved ?? []).map((item) => stateKey(item.id, item.media_type)));
  }, [saved, withFriendsSaved, showFriendsSocial]);

  const filteredSaved = useMemo(
    () =>
      (saved ?? []).filter((item) => {
        if (filterType !== "all" && item.media_type !== filterType) return false;
        if ((item.vote_average ?? 0) < minRating) return false;

        if (selectedGenreIds.length > 0) {
          const itemGenreIds = item.genre_ids ?? item.genres?.map((g) => g.id) ?? [];
          if (!selectedGenreIds.some((genreId) => itemGenreIds.includes(genreId))) return false;
        }

        if (yearFrom.trim()) {
          const parsedYearFrom = Number.parseInt(yearFrom, 10);
          if (!Number.isNaN(parsedYearFrom)) {
            const dateString = item.media_type === "movie" ? item.release_date : item.first_air_date;
            const itemYear = dateString ? Number.parseInt(dateString.slice(0, 4), 10) : NaN;
            if (Number.isNaN(itemYear) || itemYear < parsedYearFrom) return false;
          }
        }

        return true;
      }),
    [filterType, minRating, saved, selectedGenreIds, yearFrom],
  );

  const processedSaved = useMemo(() => {
    if (sortBy === "default") return filteredSaved;
    const sorted = [...filteredSaved];

    if (sortBy === "title_asc") {
      sorted.sort((a, b) => {
        const aTitle = (a.title ?? a.name ?? "").toLowerCase();
        const bTitle = (b.title ?? b.name ?? "").toLowerCase();
        return aTitle.localeCompare(bTitle);
      });
      return sorted;
    }

    if (sortBy === "title_desc") {
      sorted.sort((a, b) => {
        const aTitle = (a.title ?? a.name ?? "").toLowerCase();
        const bTitle = (b.title ?? b.name ?? "").toLowerCase();
        return bTitle.localeCompare(aTitle);
      });
      return sorted;
    }

    sorted.sort((a, b) => (b.vote_average ?? 0) - (a.vote_average ?? 0));
    return sorted;
  }, [filteredSaved, sortBy]);

  const { data: stateMap } = useMediaStateMap(processedSaved);

  if (isLoading && (saved ?? []).length === 0) {
    return (
      <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="aspect-2/3 w-full rounded-4xl bg-neutral-800/70 animate-pulse" />
        ))}
      </div>
    );
  }
  if (isError) return <p className="p-5 text-red-400">Error: {error?.message}</p>;

  return (
    <div>
      {!processedSaved.length ? (
        <div className="p-5">
          <p className="text-neutral-400">
            {saved?.length
              ? "No saved items match your current sort/filter settings."
              : showFriendsSocial
                ? "No shared saved/liked/favorited media found for you and your selected friends."
                : withFriendsSaved
                ? "No suggestions yet. Pick friends with overlapping saved, liked, or favorited titles (dislikes are excluded for everyone)."
                : "No saved items yet. Tap the bookmark on any movie or show's detail page."}
          </p>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5">
          {processedSaved.map((item) => {
            const key = stateKey(item.id, item.media_type);
            const isSavedForUser =
              (stateMap?.[key]?.is_saved ?? false) || userOnlySavedKeySet.has(key);
            return (
              <MediaCard
                key={`${item.media_type}-${item.id}`}
                item={item}
                isSaved={isSavedForUser}
              />
            );
          })}
        </div>
      )}

    </div>
  );
};

export default SavedPage;
