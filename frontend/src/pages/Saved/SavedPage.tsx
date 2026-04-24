import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown, Filter, Star, Users } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useSavedList } from "../../hooks/useMedia";
import { getFriendOverview, type FriendUser } from "../../api/friends";
import { floatingActionButtonBaseClass } from "../../constants/floatingActionButton";
import MediaCard from "../Discovery/MediaCard";

const MOVIE_GENRES: Array<{ id: number; name: string }> = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 27, name: "Horror" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 53, name: "Thriller" },
];

const TV_GENRES: Array<{ id: number; name: string }> = [
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 9648, name: "Mystery" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10766, name: "Soap" },
  { id: 10767, name: "Talk" },
  { id: 10768, name: "War & Politics" },
  { id: 37, name: "Western" },
];

const ALL_GENRES = [...MOVIE_GENRES, ...TV_GENRES].reduce<Array<{ id: number; name: string }>>(
  (acc, genre) => {
    if (!acc.some((g) => g.id === genre.id)) acc.push(genre);
    return acc;
  },
  [],
);

const SavedPage = () => {
  const [showFriends, setShowFriends] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "title_asc" | "title_desc" | "rating_desc">(
    "default",
  );
  const [filterType, setFilterType] = useState<"all" | "movie" | "tv">("all");
  const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
  const [minRating, setMinRating] = useState<0 | 6 | 7 | 8>(0);
  const [yearFrom, setYearFrom] = useState("");
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const friendsFilterOn = selectedFriendIds.length > 0;
  const floatingControlsRef = useRef<HTMLDivElement>(null);
  const { data: saved, isLoading, isError, error } = useSavedList({
    withFriendsSaved: friendsFilterOn,
    friendIds: selectedFriendIds,
  });

  const visibleGenreOptions = filterType === "tv" ? TV_GENRES : filterType === "movie" ? MOVIE_GENRES : ALL_GENRES;
  const hasActiveFilters =
    filterType !== "all" || minRating !== 0 || yearFrom.trim() !== "" || selectedGenreIds.length > 0;
  const sortButtonIcon =
    sortBy === "title_asc"
      ? <ArrowDownAZ size={24} strokeWidth={2.5} />
      : sortBy === "title_desc"
        ? <ArrowUpAZ size={24} strokeWidth={2.5} />
        : sortBy === "rating_desc"
          ? <Star size={24} strokeWidth={2.5} />
          : <ArrowUpDown size={24} strokeWidth={2.5} />;
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!floatingControlsRef.current?.contains(target)) {
        setShowFilter(false);
        setShowSort(false);
        setShowFriends(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!showFriends) return;
    let cancelled = false;
    setFriendsLoading(true);
    getFriendOverview()
      .then((data) => {
        if (cancelled) return;
        setFriends(data.friends ?? []);
      })
      .catch(() => {
        if (!cancelled) setFriends([]);
      })
      .finally(() => {
        if (!cancelled) setFriendsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showFriends]);

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
              : friendsFilterOn
                ? "No shared saved items found (without likes/dislikes)."
                : "No saved items yet. Tap the bookmark on any movie or show's detail page."}
          </p>
        </div>
      ) : (
        <div className="p-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 gap-5">
          {processedSaved.map((item) => (
            <MediaCard key={`${item.media_type}-${item.id}`} item={item} isSaved />
          ))}
        </div>
      )}

      <div
        ref={floatingControlsRef}
        className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3"
      >
        <div className="relative">
          <AnimatePresence>
            {showFilter && (
              <motion.div
                className="absolute right-full bottom-0 mr-2 w-64 rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-3 backdrop-blur-md"
                initial={{ opacity: 0, x: 10, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
            <p className="px-1 text-xs uppercase tracking-wide text-neutral-400">Type</p>
            <div className="mt-2 flex gap-1">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`rounded-2xl px-3 py-1.5 text-xs transition ${
                  filterType === "all" ? "bg-neutral-700/80 text-white" : "text-neutral-300 hover:bg-neutral-700/60"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType("movie")}
                className={`rounded-2xl px-3 py-1.5 text-xs transition ${
                  filterType === "movie"
                    ? "bg-neutral-700/80 text-white"
                    : "text-neutral-300 hover:bg-neutral-700/60"
                }`}
              >
                Movies
              </button>
              <button
                type="button"
                onClick={() => setFilterType("tv")}
                className={`rounded-2xl px-3 py-1.5 text-xs transition ${
                  filterType === "tv" ? "bg-neutral-700/80 text-white" : "text-neutral-300 hover:bg-neutral-700/60"
                }`}
              >
                TV
              </button>
            </div>

            <label className="mt-3 block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="saved-min-rating">
              Min rating
            </label>
            <select
              id="saved-min-rating"
              value={minRating}
              onChange={(e) => setMinRating(Number.parseInt(e.target.value, 10) as 0 | 6 | 7 | 8)}
              className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 outline-none"
            >
              <option value={0}>Any</option>
              <option value={6}>6+</option>
              <option value={7}>7+</option>
              <option value={8}>8+</option>
            </select>

            <label className="mt-3 block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="saved-year-from">
              Year from
            </label>
            <input
              id="saved-year-from"
              inputMode="numeric"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
              placeholder="e.g. 2018"
              className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none"
            />

            <p className="mt-3 px-1 text-xs uppercase tracking-wide text-neutral-400">Genres</p>
            <div className="mt-2 flex max-h-40 flex-wrap gap-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {visibleGenreOptions.map((genre) => {
                const isActive = selectedGenreIds.includes(genre.id);
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() =>
                      setSelectedGenreIds((prev) =>
                        prev.includes(genre.id)
                          ? prev.filter((id) => id !== genre.id)
                          : [...prev, genre.id],
                      )
                    }
                    className={`rounded-2xl px-2.5 py-1 text-xs transition ${
                      isActive
                        ? "bg-white border border-white text-neutral-900"
                        : "border border-neutral-600 text-neutral-300 hover:bg-neutral-700/60"
                    }`}
                  >
                    {genre.name}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setFilterType("all");
                setMinRating(0);
                setYearFrom("");
                setSelectedGenreIds([]);
              }}
              className="mt-3 w-full rounded-2xl border border-neutral-600 px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-700/60"
            >
              Clear filters
            </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => {
              setShowFilter((prev) => !prev);
              setShowSort(false);
            }}
            className={`${floatingActionButtonBaseClass} ${
              hasActiveFilters ? "bg-emerald-500/80 border-emerald-400 text-white hover:text-white" : ""
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter size={24} strokeWidth={2.5} />
          </motion.button>
        </div>

        <div className="relative">
          <AnimatePresence>
            {showSort && (
              <motion.div
                className="absolute right-full bottom-0 mr-2 w-48 rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-2 backdrop-blur-md"
                initial={{ opacity: 0, x: 10, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
            <button
              type="button"
              onClick={() => setSortBy("default")}
              className={`flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition ${
                sortBy === "default" ? "bg-neutral-700/80 text-white" : "text-neutral-300 hover:bg-neutral-700/60"
              }`}
            >
              <ArrowUpDown size={15} /> Default
            </button>
            <button
              type="button"
              onClick={() => setSortBy("title_asc")}
              className={`mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition ${
                sortBy === "title_asc" ? "bg-neutral-700/80 text-white" : "text-neutral-300 hover:bg-neutral-700/60"
              }`}
            >
              <ArrowDownAZ size={15} /> Title A-Z
            </button>
            <button
              type="button"
              onClick={() => setSortBy("title_desc")}
              className={`mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition ${
                sortBy === "title_desc" ? "bg-neutral-700/80 text-white" : "text-neutral-300 hover:bg-neutral-700/60"
              }`}
            >
              <ArrowUpAZ size={15} /> Title Z-A
            </button>
            <button
              type="button"
              onClick={() => setSortBy("rating_desc")}
              className={`mt-1 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition ${
                sortBy === "rating_desc" ? "bg-neutral-700/80 text-white" : "text-neutral-300 hover:bg-neutral-700/60"
              }`}
            >
              <Star size={15} /> Rating high-low
            </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => {
              setShowSort((prev) => !prev);
              setShowFilter(false);
            }}
            className={`${floatingActionButtonBaseClass} ${
              sortBy !== "default" ? "bg-emerald-500/80 border-emerald-400 text-white hover:text-white" : ""
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {sortButtonIcon}
          </motion.button>
        </div>

        <div className="relative">
          <AnimatePresence>
            {showFriends && (
              <motion.div
                className="absolute right-full bottom-0 mr-2 w-64 rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-3 backdrop-blur-md"
                initial={{ opacity: 0, x: 10, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 10, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <p className="px-1 text-xs uppercase tracking-wide text-neutral-400">Watch together with</p>
                {friendsLoading ? (
                  <p className="mt-3 text-sm text-neutral-400">Loading friends...</p>
                ) : friends.length === 0 ? (
                  <p className="mt-3 text-sm text-neutral-400">No accepted friends yet.</p>
                ) : (
                  <div className="mt-3 flex max-h-44 flex-wrap gap-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {friends.map((friend) => {
                      const isActive = selectedFriendIds.includes(friend.id);
                      return (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() =>
                            setSelectedFriendIds((prev) =>
                              prev.includes(friend.id)
                                ? prev.filter((id) => id !== friend.id)
                                : [...prev, friend.id],
                            )
                          }
                          className={`rounded-2xl px-2.5 py-1 text-xs transition ${
                            isActive
                              ? "bg-white border border-white text-neutral-900"
                              : "border border-neutral-600 text-neutral-300 hover:bg-neutral-700/60"
                          }`}
                        >
                          {friend.name}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedFriendIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedFriendIds([])}
                    className="mt-3 w-full rounded-2xl border border-neutral-600 px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-700/60"
                  >
                    Clear friends
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => {
              setShowFriends((prev) => !prev);
              setShowFilter(false);
              setShowSort(false);
            }}
            className={`${floatingActionButtonBaseClass} ${
              friendsFilterOn ? "bg-emerald-500/80 border-emerald-400 text-white hover:text-white" : ""
            }`}
            aria-pressed={friendsFilterOn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Users size={24} strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default SavedPage;
