import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Bookmark,
  Compass,
  Filter,
  Heart,
  Search,
  Star,
  User,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { floatingActionButtonBaseClass } from "../constants/floatingActionButton";
import { getFriendOverview, type FriendUser } from "../api/friends";

const routes = [
  { path: "/profile", icon: User },
  { path: "/discovery", icon: Compass },
  { path: "/saved", icon: Bookmark },
];

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

type SortKind = "default" | "title_asc" | "title_desc" | "rating_desc";
type FilterType = "all" | "movie" | "tv";
type MinRating = 0 | 6 | 7 | 8;

export type MainLayoutOutletContext = {
  discoveryControls: {
    showSearch: boolean;
    query: string;
    sortBy: SortKind;
    filterType: FilterType;
    selectedGenreIds: number[];
    minRating: MinRating;
    yearFrom: string;
    setFilterType: (value: FilterType) => void;
    setSelectedGenreIds: Dispatch<SetStateAction<number[]>>;
    setMinRating: (value: MinRating) => void;
    setYearFrom: (value: string) => void;
  };
  savedControls: {
    sortBy: SortKind;
    filterType: FilterType;
    selectedGenreIds: number[];
    minRating: MinRating;
    yearFrom: string;
    selectedFriendIds: number[];
    showFriendsSocial: boolean;
    withFriendsSaved: boolean;
    setFilterType: (value: FilterType) => void;
    setSelectedGenreIds: Dispatch<SetStateAction<number[]>>;
    setMinRating: (value: MinRating) => void;
    setYearFrom: (value: string) => void;
  };
};

const MainLayout = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isDiscovery = pathname === "/discovery";
  const isSaved = pathname === "/saved";

  const [dShowSearch, setDShowSearch] = useState(false);
  const [dShowFilter, setDShowFilter] = useState(false);
  const [dShowSort, setDShowSort] = useState(false);
  const [dSortBy, setDSortBy] = useState<SortKind>("default");
  const [dFilterType, setDFilterType] = useState<FilterType>("all");
  const [dSelectedGenreIds, setDSelectedGenreIds] = useState<number[]>([]);
  const [dMinRating, setDMinRating] = useState<MinRating>(0);
  const [dYearFrom, setDYearFrom] = useState("");
  const [dQuery, setDQuery] = useState("");
  const dSearchInputRef = useRef<HTMLInputElement>(null);

  const [sShowFriends, setSShowFriends] = useState(false);
  const [sShowFilter, setSShowFilter] = useState(false);
  const [sShowSort, setSShowSort] = useState(false);
  const [sSortBy, setSSortBy] = useState<SortKind>("default");
  const [sFilterType, setSFilterType] = useState<FilterType>("all");
  const [sSelectedGenreIds, setSSelectedGenreIds] = useState<number[]>([]);
  const [sMinRating, setSMinRating] = useState<MinRating>(0);
  const [sYearFrom, setSYearFrom] = useState("");
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [showFriendsSocial, setShowFriendsSocial] = useState(false);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  useEffect(() => {
    if (dShowSearch) dSearchInputRef.current?.focus();
  }, [dShowSearch]);

  useEffect(() => {
    setDSelectedGenreIds([]);
  }, [dFilterType]);

  useEffect(() => {
    setSSelectedGenreIds([]);
  }, [sFilterType]);

  useEffect(() => {
    if (!sShowFriends || !isSaved) return;
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
  }, [sShowFriends, isSaved]);

  const hasOpenModal = isDiscovery
    ? dShowSearch || dShowFilter || dShowSort
    : isSaved
      ? sShowFriends || sShowFilter || sShowSort
      : false;

  const sortButtonIcon = (sortBy: SortKind) =>
    sortBy === "title_asc"
      ? <ArrowDownAZ size={24} strokeWidth={2.5} />
      : sortBy === "title_desc"
        ? <ArrowUpAZ size={24} strokeWidth={2.5} />
        : sortBy === "rating_desc"
          ? <Star size={24} strokeWidth={2.5} />
          : <ArrowUpDown size={24} strokeWidth={2.5} />;

  const outletContext: MainLayoutOutletContext = useMemo(
    () => ({
      discoveryControls: {
        showSearch: dShowSearch,
        query: dQuery,
        sortBy: dSortBy,
        filterType: dFilterType,
        selectedGenreIds: dSelectedGenreIds,
        minRating: dMinRating,
        yearFrom: dYearFrom,
        setFilterType: setDFilterType,
        setSelectedGenreIds: setDSelectedGenreIds,
        setMinRating: setDMinRating,
        setYearFrom: setDYearFrom,
      },
      savedControls: {
        sortBy: sSortBy,
        filterType: sFilterType,
        selectedGenreIds: sSelectedGenreIds,
        minRating: sMinRating,
        yearFrom: sYearFrom,
        selectedFriendIds,
        showFriendsSocial,
        withFriendsSaved: selectedFriendIds.length > 0,
        setFilterType: setSFilterType,
        setSelectedGenreIds: setSSelectedGenreIds,
        setMinRating: setSMinRating,
        setYearFrom: setSYearFrom,
      },
    }),
    [
      dShowSearch, dQuery, dSortBy, dFilterType, dSelectedGenreIds, dMinRating, dYearFrom,
      sSortBy, sFilterType, sSelectedGenreIds, sMinRating, sYearFrom, selectedFriendIds, showFriendsSocial,
    ],
  );

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-neutral-900">
      <div
        className="pointer-events-none fixed inset-0 opacity-35"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(163,163,163,0.2) 1px, transparent 0)",
          backgroundSize: "20px 20px",
          backgroundPosition: "center center",
        }}
      />
      <main className="relative z-10 flex-1">
        <Outlet context={outletContext} />
      </main>
      {user && hasOpenModal && (
        <button
          type="button"
          aria-label="Close open modal"
          className="fixed inset-0 z-40 cursor-default bg-transparent"
          onClick={() => {
            setDShowSearch(false);
            setDShowFilter(false);
            setDShowSort(false);
            setSShowFriends(false);
            setSShowFilter(false);
            setSShowSort(false);
          }}
        />
      )}
      {user && isDiscovery && (
        <>
          <AnimatePresence>
            {dShowSearch && (
              <motion.div
                key="discovery-search-bar"
                className="fixed top-0 left-0 right-0 z-[70] p-5"
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <div className="mx-auto max-w-4xl">
                  <motion.div
                    className="bg-neutral-800/80 border-t border-neutral-600 backdrop-blur-md rounded-4xl px-4 py-3"
                    initial={{ scale: 0.98 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                  >
                    <input
                      ref={dSearchInputRef}
                      value={dQuery}
                      onChange={(e) => setDQuery(e.target.value)}
                      placeholder="Search movies or TV..."
                      className="w-full bg-transparent text-neutral-100 placeholder:text-neutral-400 outline-none font-space-grotesk"
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
            <div className="relative">
              <AnimatePresence>
                {dShowFilter && (
                  <motion.div
                    className="absolute right-full bottom-0 z-[70] mr-2 w-64 rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-3 backdrop-blur-md"
                    initial={{ opacity: 0, x: 10, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <p className="px-1 text-xs uppercase tracking-wide text-neutral-400">Type</p>
                    <div className="mt-2 flex gap-1">
                      {(["all", "movie", "tv"] as FilterType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setDFilterType(type)}
                          className={`rounded-2xl px-3 py-1.5 text-xs transition ${
                            dFilterType === type ? "bg-neutral-700/80 text-white" : "text-neutral-300 hover:bg-neutral-700/60"
                          }`}
                        >
                          {type === "all" ? "All" : type === "movie" ? "Movies" : "TV"}
                        </button>
                      ))}
                    </div>
                    <label className="mt-3 block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="layout-min-rating">Min rating</label>
                    <select
                      id="layout-min-rating"
                      value={dMinRating}
                      onChange={(e) => setDMinRating(Number.parseInt(e.target.value, 10) as MinRating)}
                      className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 outline-none"
                    >
                      <option value={0}>Any</option><option value={6}>6+</option><option value={7}>7+</option><option value={8}>8+</option>
                    </select>
                    <label className="mt-3 block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="layout-year-from">Year from</label>
                    <input
                      id="layout-year-from"
                      inputMode="numeric"
                      value={dYearFrom}
                      onChange={(e) => setDYearFrom(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                      placeholder="e.g. 2018"
                      className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none"
                    />
                    <p className="mt-3 px-1 text-xs uppercase tracking-wide text-neutral-400">Genres</p>
                    <div className="mt-2 flex max-h-40 flex-wrap gap-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {(dFilterType === "tv" ? TV_GENRES : dFilterType === "movie" ? MOVIE_GENRES : ALL_GENRES).map((genre) => {
                        const active = dSelectedGenreIds.includes(genre.id);
                        return (
                          <button
                            key={genre.id}
                            type="button"
                            onClick={() => setDSelectedGenreIds((prev) => prev.includes(genre.id) ? prev.filter((id) => id !== genre.id) : [...prev, genre.id])}
                            className={`rounded-2xl px-2.5 py-1 text-xs transition ${active ? "bg-white border border-white text-neutral-900" : "border border-neutral-600 text-neutral-300 hover:bg-neutral-700/60"}`}
                          >
                            {genre.name}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setDFilterType("all"); setDMinRating(0); setDYearFrom(""); setDSelectedGenreIds([]); }}
                      className="mt-3 w-full rounded-2xl border border-neutral-600 px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-700/60"
                    >
                      Clear filters
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                type="button"
                onClick={() => { setDShowFilter((prev) => !prev); setDShowSort(false); setDShowSearch(false); }}
                className={`${floatingActionButtonBaseClass} ${dFilterType !== "all" || dMinRating !== 0 || dYearFrom.trim() !== "" || dSelectedGenreIds.length > 0 ? "bg-emerald-500/80 border-emerald-400 text-white hover:text-white" : ""}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Filter size={24} strokeWidth={2.5} />
              </motion.button>
            </div>

            <div className="relative">
              <AnimatePresence>
                {dShowSort && (
                  <motion.div
                    className="absolute right-full bottom-0 z-[70] mr-2 w-48 rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-2 backdrop-blur-md"
                    initial={{ opacity: 0, x: 10, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    {[
                      { key: "default" as SortKind, label: "Default", icon: <ArrowUpDown size={15} /> },
                      { key: "title_asc" as SortKind, label: "Title A-Z", icon: <ArrowDownAZ size={15} /> },
                      { key: "title_desc" as SortKind, label: "Title Z-A", icon: <ArrowUpAZ size={15} /> },
                      { key: "rating_desc" as SortKind, label: "Rating high-low", icon: <Star size={15} /> },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setDSortBy(opt.key)}
                        className={`mt-1 first:mt-0 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition ${dSortBy === opt.key ? "bg-neutral-700/80 text-white" : "text-neutral-300 hover:bg-neutral-700/60"}`}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                type="button"
                onClick={() => { setDShowSort((prev) => !prev); setDShowFilter(false); setDShowSearch(false); }}
                className={`${floatingActionButtonBaseClass} ${dSortBy !== "default" ? "bg-emerald-500/80 border-emerald-400 text-white hover:text-white" : ""}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {sortButtonIcon(dSortBy)}
              </motion.button>
            </div>

            <motion.button
              type="button"
              onClick={() => {
                if (dShowSearch) {
                  setDShowSearch(false);
                  setDQuery("");
                  return;
                }
                setDShowSearch(true);
                setDShowFilter(false);
                setDShowSort(false);
              }}
              className={floatingActionButtonBaseClass}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {dShowSearch ? <X size={24} strokeWidth={2.5} /> : <Search size={24} strokeWidth={2.5} />}
            </motion.button>
          </div>
        </>
      )}

      {user && isSaved && (
        <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
          <div className="relative">
            <AnimatePresence>
              {sShowFilter && (
                <motion.div
                  className="absolute right-full bottom-0 z-[70] mr-2 w-64 rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-3 backdrop-blur-md"
                  initial={{ opacity: 0, x: 10, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <p className="px-1 text-xs uppercase tracking-wide text-neutral-400">Type</p>
                  <div className="mt-2 flex gap-1">
                    {(["all", "movie", "tv"] as FilterType[]).map((type) => (
                      <button key={type} type="button" onClick={() => setSFilterType(type)} className={`rounded-2xl px-3 py-1.5 text-xs transition ${sFilterType === type ? "bg-neutral-700/80 text-white" : "text-neutral-300 hover:bg-neutral-700/60"}`}>
                        {type === "all" ? "All" : type === "movie" ? "Movies" : "TV"}
                      </button>
                    ))}
                  </div>
                  <label className="mt-3 block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="saved-layout-min-rating">Min rating</label>
                  <select id="saved-layout-min-rating" value={sMinRating} onChange={(e) => setSMinRating(Number.parseInt(e.target.value, 10) as MinRating)} className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 outline-none">
                    <option value={0}>Any</option><option value={6}>6+</option><option value={7}>7+</option><option value={8}>8+</option>
                  </select>
                  <label className="mt-3 block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="saved-layout-year-from">Year from</label>
                  <input id="saved-layout-year-from" inputMode="numeric" value={sYearFrom} onChange={(e) => setSYearFrom(e.target.value.replace(/[^\d]/g, "").slice(0, 4))} placeholder="e.g. 2018" className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none" />
                  <p className="mt-3 px-1 text-xs uppercase tracking-wide text-neutral-400">Genres</p>
                  <div className="mt-2 flex max-h-40 flex-wrap gap-1 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {(sFilterType === "tv" ? TV_GENRES : sFilterType === "movie" ? MOVIE_GENRES : ALL_GENRES).map((genre) => {
                      const active = sSelectedGenreIds.includes(genre.id);
                      return (
                        <button key={genre.id} type="button" onClick={() => setSSelectedGenreIds((prev) => prev.includes(genre.id) ? prev.filter((id) => id !== genre.id) : [...prev, genre.id])} className={`rounded-2xl px-2.5 py-1 text-xs transition ${active ? "bg-white border border-white text-neutral-900" : "border border-neutral-600 text-neutral-300 hover:bg-neutral-700/60"}`}>
                          {genre.name}
                        </button>
                      );
                    })}
                  </div>
                  <button type="button" onClick={() => { setSFilterType("all"); setSMinRating(0); setSYearFrom(""); setSSelectedGenreIds([]); }} className="mt-3 w-full rounded-2xl border border-neutral-600 px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-700/60">
                    Clear filters
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button type="button" onClick={() => { setSShowFilter((prev) => !prev); setSShowSort(false); setSShowFriends(false); }} className={`${floatingActionButtonBaseClass} ${sFilterType !== "all" || sMinRating !== 0 || sYearFrom.trim() !== "" || sSelectedGenreIds.length > 0 ? "bg-emerald-500/80 border-emerald-400 text-white hover:text-white" : ""}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Filter size={24} strokeWidth={2.5} />
            </motion.button>
          </div>

          <div className="relative">
            <AnimatePresence>
              {sShowSort && (
                <motion.div className="absolute right-full bottom-0 z-[70] mr-2 w-48 rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-2 backdrop-blur-md" initial={{ opacity: 0, x: 10, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 10, scale: 0.98 }} transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}>
                  {[
                    { key: "default" as SortKind, label: "Default", icon: <ArrowUpDown size={15} /> },
                    { key: "title_asc" as SortKind, label: "Title A-Z", icon: <ArrowDownAZ size={15} /> },
                    { key: "title_desc" as SortKind, label: "Title Z-A", icon: <ArrowUpAZ size={15} /> },
                    { key: "rating_desc" as SortKind, label: "Rating high-low", icon: <Star size={15} /> },
                  ].map((opt) => (
                    <button key={opt.key} type="button" onClick={() => setSSortBy(opt.key)} className={`mt-1 first:mt-0 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition ${sSortBy === opt.key ? "bg-neutral-700/80 text-white" : "text-neutral-300 hover:bg-neutral-700/60"}`}>
                      {opt.icon} {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button type="button" onClick={() => { setSShowSort((prev) => !prev); setSShowFilter(false); setSShowFriends(false); }} className={`${floatingActionButtonBaseClass} ${sSortBy !== "default" ? "bg-emerald-500/80 border-emerald-400 text-white hover:text-white" : ""}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {sortButtonIcon(sSortBy)}
            </motion.button>
          </div>

          <div className="relative">
            <AnimatePresence>
              {sShowFriends && (
                <motion.div className="absolute right-full bottom-0 z-[70] mr-2 w-64 rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-3 backdrop-blur-md" initial={{ opacity: 0, x: 10, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 10, scale: 0.98 }} transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}>
                  {friendsLoading ? (
                    <p className="mt-3 text-sm text-neutral-400">Loading friends...</p>
                  ) : friends.length === 0 ? (
                    <p className="mt-3 text-sm text-neutral-400">No accepted friends yet.</p>
                  ) : (
                    <div className="flex max-w-64 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {friends.map((friend) => {
                        const active = selectedFriendIds.includes(friend.id);
                        return (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() => {
                              setShowFriendsSocial(false);
                              setSelectedFriendIds((prev) =>
                                prev.includes(friend.id)
                                  ? prev.filter((id) => id !== friend.id)
                                  : [...prev, friend.id],
                              );
                            }}
                            className={`flex w-20 shrink-0 flex-col items-center rounded-2xl px-2 py-2 transition ${
                              active
                                ? "bg-white text-neutral-900"
                                : "text-neutral-300 hover:bg-neutral-700/60"
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 items-center justify-center rounded-full ${
                                active ? "bg-neutral-200" : "bg-neutral-700/80"
                              }`}
                            >
                              <User size={18} strokeWidth={2.5} />
                            </span>
                            <span className="mt-1 w-full truncate text-center text-[11px]">
                              {friend.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {selectedFriendIds.length > 0 && (
                    <button type="button" onClick={() => setSelectedFriendIds([])} className="mt-3 w-full rounded-2xl border border-neutral-600 px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-700/60">
                      Clear friends
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.button type="button" onClick={() => { setSShowFriends((prev) => !prev); setSShowFilter(false); setSShowSort(false); setShowFriendsSocial(false); }} className={`${floatingActionButtonBaseClass} ${selectedFriendIds.length > 0 ? "bg-emerald-500/80 border-emerald-400 text-white hover:text-white" : ""}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Users size={24} strokeWidth={2.5} />
            </motion.button>
          </div>

          <motion.button
            type="button"
            onClick={() =>
              setShowFriendsSocial((prev) => {
                const next = !prev;
                if (next) setSelectedFriendIds([]);
                return next;
              })
            }
            className={`${floatingActionButtonBaseClass} ${showFriendsSocial ? "bg-emerald-500/80 border-emerald-400 text-white hover:text-white" : ""}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <User size={24} strokeWidth={2.5} />
          </motion.button>
        </div>
      )}

      {user && (
        <footer className="fixed bottom-0 left-0 right-0 z-10 p-5 pointer-events-none">
          <nav className="mx-auto flex h-14 w-fit items-center gap-2 rounded-4xl border-t border-neutral-600 bg-neutral-800/80 px-2 backdrop-blur-md pointer-events-auto">
            {routes.map((route) => {
              const active = pathname === route.path;
              return (
                <motion.div key={route.path} whileHover={{ scale: 1.08, rotate: 2 }} whileTap={{ scale: 0.94, rotate: -10 }}>
                  <Link
                    to={route.path}
                    className={`relative flex h-12 w-12 items-center justify-center rounded-3xl transition-colors ${
                      active
                        ? "text-neutral-100"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <route.icon size={24} strokeWidth={2.5} className="relative z-10" />
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </footer>
      )}
    </div>
  );
};

export default MainLayout;
