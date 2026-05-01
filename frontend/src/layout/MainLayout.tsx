import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { fetchCertificationsList, fetchWatchProvidersCatalog, type WatchProviderRow } from "../api/tmdb";
import { tmdbCountryName } from "../constants/tmdbCountries";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowUpDown,
  Bookmark,
  Compass,
  Filter,
  Search,
  Star,
  User,
  Users,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { floatingActionButtonBaseClass } from "../constants/floatingActionButton";
import { AnimatedNavIcon } from "../components/AnimatedNavIcon";
import { getFriendOverview } from "../api/friends";
import { WatchTogetherUserStack } from "../components/WatchTogetherUserStack";

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
export type FilterType = "all" | "movie" | "tv";
export type MinRating = 0 | 6 | 7 | 8;
type WatchFilter = "all" | "watched" | "unwatched";
type FavoriteFilter = "all" | "favorited";

export type MainLayoutOutletContext = {
  discoveryControls: {
    showSearch: boolean;
    query: string;
    sortBy: SortKind;
    filterType: FilterType;
    selectedGenreIds: number[];
    minRating: MinRating;
    watchedFilter: WatchFilter;
    favoriteFilter: FavoriteFilter;
    yearFrom: string;
    selectedWatchProviderIds: number[];
    certification: string;
    watchRegion: string;
    setFilterType: (value: FilterType) => void;
    setSelectedGenreIds: Dispatch<SetStateAction<number[]>>;
    setMinRating: (value: MinRating) => void;
    setYearFrom: (value: string) => void;
    setSelectedWatchProviderIds: Dispatch<SetStateAction<number[]>>;
    setCertification: (value: string) => void;
  };
  savedControls: {
    sortBy: SortKind;
    filterType: FilterType;
    selectedGenreIds: number[];
    minRating: MinRating;
    watchedFilter: WatchFilter;
    favoriteFilter: FavoriteFilter;
    yearFrom: string;
    selectedWatchProviderIds: number[];
    certification: string;
    watchRegion: string;
    selectedFriendIds: number[];
    showFriendsSocial: boolean;
    withFriendsSaved: boolean;
    setFilterType: (value: FilterType) => void;
    setSelectedGenreIds: Dispatch<SetStateAction<number[]>>;
    setMinRating: (value: MinRating) => void;
    setYearFrom: (value: string) => void;
    setSelectedWatchProviderIds: Dispatch<SetStateAction<number[]>>;
    setCertification: (value: string) => void;
  };
};

const MainLayout = () => {
  const noopCertification = useCallback(() => {}, []);
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
  const [dWatchedFilter, setDWatchedFilter] = useState<WatchFilter>("all");
  const [dFavoriteFilter, setDFavoriteFilter] = useState<FavoriteFilter>("all");
  const [dYearFrom, setDYearFrom] = useState("");
  const [dQuery, setDQuery] = useState("");
  const [dSelectedWatchProviderIds, setDSelectedWatchProviderIds] = useState<number[]>([]);
  const [dCertification, setDCertification] = useState("");
  const dSearchInputRef = useRef<HTMLInputElement>(null);

  const [sShowFriends, setSShowFriends] = useState(false);
  const [sShowFilter, setSShowFilter] = useState(false);
  const [sShowSort, setSShowSort] = useState(false);
  const [sSortBy, setSSortBy] = useState<SortKind>("default");
  const [sFilterType, setSFilterType] = useState<FilterType>("all");
  const [sSelectedGenreIds, setSSelectedGenreIds] = useState<number[]>([]);
  const [sMinRating, setSMinRating] = useState<MinRating>(0);
  const [sWatchedFilter, setSWatchedFilter] = useState<WatchFilter>("all");
  const [sFavoriteFilter, setSFavoriteFilter] = useState<FavoriteFilter>("all");
  const [sYearFrom, setSYearFrom] = useState("");
  const [sSelectedWatchProviderIds, setSSelectedWatchProviderIds] = useState<number[]>([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState<number[]>([]);
  const [showFriendsSocial, setShowFriendsSocial] = useState(false);

  const watchRegion =
    user?.country_code && user.country_code.length === 2
      ? user.country_code.toUpperCase()
      : "US";

  const discoverySortPanelOpen = isDiscovery && dShowSort;
  const savedSortPanelOpen = isSaved && sShowSort;
  const filterTypeForCerts = isDiscovery ? dFilterType : sFilterType;
  const certListType = filterTypeForCerts === "tv" ? "tv" : "movie";

  const watchProvidersCatalog = useQuery({
    queryKey: ["catalog", "watch-providers", "movie", watchRegion],
    queryFn: () => fetchWatchProvidersCatalog({ type: "movie", watch_region: watchRegion }),
    enabled: Boolean(user && (discoverySortPanelOpen || savedSortPanelOpen)),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const certificationsCatalog = useQuery({
    queryKey: ["catalog", "certifications", certListType],
    queryFn: () => fetchCertificationsList(certListType),
    enabled: Boolean(user && (discoverySortPanelOpen || savedSortPanelOpen)),
    staleTime: 24 * 60 * 60 * 1000,
  });

  const mergedProviderOptions = useMemo(() => {
    const d = watchProvidersCatalog.data;
    if (!d) return [];
    const map = new Map<number, WatchProviderRow>();
    for (const row of [...d.flatrate, ...d.rent, ...d.buy]) {
      if (!map.has(row.provider_id)) map.set(row.provider_id, row);
    }
    return [...map.values()].sort((a, b) => a.provider_name.localeCompare(b.provider_name));
  }, [watchProvidersCatalog.data]);

  const certOptionsForRegion = useMemo(() => {
    const raw = certificationsCatalog.data?.certifications?.[watchRegion];
    if (!raw?.length) return [];
    return [...raw]
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        value: c.certification,
        label: c.meaning ? `${c.certification} — ${c.meaning}` : c.certification,
      }));
  }, [certificationsCatalog.data, watchRegion]);

  useEffect(() => {
    if (dShowSearch) dSearchInputRef.current?.focus();
  }, [dShowSearch]);

  useEffect(() => {
    setDSelectedGenreIds([]);
  }, [dFilterType]);

  useEffect(() => {
    setSSelectedGenreIds([]);
  }, [sFilterType]);

  const {
    data: friendsOverview,
    isFetching: friendsLoading,
  } = useQuery({
    queryKey: ["friends", "overview"],
    queryFn: getFriendOverview,
    // Keep friends overview active on Saved so realtime invalidations refetch it.
    enabled: isSaved,
    staleTime: 30_000,
    refetchOnMount: "always",
  });
  const friends = friendsOverview?.friends ?? [];

  /** Full-screen backdrop; omit discovery search so the grid stays clickable while searching. */
  const hasModalBackdrop =
    (isDiscovery && (dShowFilter || dShowSort)) ||
    (isSaved && (sShowFriends || sShowFilter || sShowSort));

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
        watchedFilter: dWatchedFilter,
        favoriteFilter: dFavoriteFilter,
        yearFrom: dYearFrom,
        selectedWatchProviderIds: dSelectedWatchProviderIds,
        certification: dCertification,
        watchRegion,
        setFilterType: setDFilterType,
        setSelectedGenreIds: setDSelectedGenreIds,
        setMinRating: setDMinRating,
        setYearFrom: setDYearFrom,
        setSelectedWatchProviderIds: setDSelectedWatchProviderIds,
        setCertification: setDCertification,
      },
      savedControls: {
        sortBy: sSortBy,
        filterType: sFilterType,
        selectedGenreIds: sSelectedGenreIds,
        minRating: sMinRating,
        watchedFilter: sWatchedFilter,
        favoriteFilter: sFavoriteFilter,
        yearFrom: sYearFrom,
        selectedWatchProviderIds: sSelectedWatchProviderIds,
        certification: "",
        watchRegion,
        selectedFriendIds,
        showFriendsSocial,
        withFriendsSaved: !showFriendsSocial && selectedFriendIds.length > 0,
        setFilterType: setSFilterType,
        setSelectedGenreIds: setSSelectedGenreIds,
        setMinRating: setSMinRating,
        setYearFrom: setSYearFrom,
        setSelectedWatchProviderIds: setSSelectedWatchProviderIds,
        setCertification: noopCertification,
      },
    }),
    [
      noopCertification,
      dShowSearch, dQuery, dSortBy, dFilterType, dSelectedGenreIds, dMinRating, dWatchedFilter, dFavoriteFilter, dYearFrom,
      dSelectedWatchProviderIds, dCertification, watchRegion,
      sSortBy, sFilterType, sSelectedGenreIds, sMinRating, sWatchedFilter, sFavoriteFilter, sYearFrom,
      sSelectedWatchProviderIds,
      selectedFriendIds, showFriendsSocial,
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
      <main className={`relative z-10 flex-1 ${user ? "pb-24" : ""}`}>
        <Outlet context={outletContext} />
      </main>
      {user && hasModalBackdrop && (
        <button
          type="button"
          aria-label="Close open modal"
          className="fixed inset-0 z-40 cursor-default bg-transparent"
          onClick={() => {
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
                    className="fixed inset-x-4 bottom-24 z-[70] rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-3 backdrop-blur-md md:absolute md:right-full md:bottom-0 md:inset-x-auto md:mr-2 md:w-[30rem]"
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
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <label className="block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="layout-min-rating">Min rating</label>
                        <select
                          id="layout-min-rating"
                          value={dMinRating}
                          onChange={(e) => setDMinRating(Number.parseInt(e.target.value, 10) as MinRating)}
                          className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 outline-none"
                        >
                          <option value={0}>Any</option><option value={6}>6+</option><option value={7}>7+</option><option value={8}>8+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="layout-watch-filter">Watch status</label>
                        <select
                          id="layout-watch-filter"
                          value={dWatchedFilter}
                          onChange={(e) => setDWatchedFilter(e.target.value as WatchFilter)}
                          className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 outline-none"
                        >
                          <option value="all">All</option>
                          <option value="watched">Watched</option>
                          <option value="unwatched">Unwatched</option>
                        </select>
                      </div>
                      <div>
                        <label className="block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="layout-year-from">Year from</label>
                        <input
                          id="layout-year-from"
                          inputMode="numeric"
                          value={dYearFrom}
                          onChange={(e) => setDYearFrom(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                          placeholder="e.g. 2018"
                          className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="layout-favorite-filter">Favorite status</label>
                        <select
                          id="layout-favorite-filter"
                          value={dFavoriteFilter}
                          onChange={(e) => setDFavoriteFilter(e.target.value as FavoriteFilter)}
                          className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 outline-none"
                        >
                          <option value="all">All</option>
                          <option value="favorited">Favorited</option>
                        </select>
                      </div>
                    </div>
                    <p className="mt-3 px-1 text-xs uppercase tracking-wide text-neutral-400">Genres</p>
                    <div className="mt-2 flex flex-wrap gap-1">
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
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setDFilterType("all"); setDMinRating(0); setDWatchedFilter("all"); setDFavoriteFilter("all"); setDYearFrom(""); setDSelectedGenreIds([]); }}
                        className="w-full rounded-2xl border border-neutral-600 px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-700/60"
                      >
                        Clear filters
                      </button>
                      <button
                        type="button"
                        onClick={() => setDShowFilter(false)}
                        className="w-full rounded-2xl border-t border-neutral-500 bg-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white"
                      >
                        Apply
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={() => { setDShowFilter((prev) => !prev); setDShowSort(false); setDShowSearch(false); }}
                className={`${floatingActionButtonBaseClass} ${dFilterType !== "all" || dMinRating !== 0 || dWatchedFilter !== "all" || dFavoriteFilter !== "all" || dYearFrom.trim() !== "" || dSelectedGenreIds.length > 0 ? "bg-emerald-500/80 border-emerald-400 text-white" : ""}`}
              >
                <AnimatedNavIcon>
                  <Filter size={24} strokeWidth={2.5} />
                </AnimatedNavIcon>
              </button>
            </div>

            <div className="relative">
              <AnimatePresence>
                {dShowSort && (
                  <motion.div
                    className="fixed inset-x-4 bottom-24 z-[70] max-h-[75vh] w-[min(26rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-3 backdrop-blur-md md:absolute md:right-full md:bottom-0 md:left-auto md:inset-x-auto md:mr-2 md:w-80"
                    initial={{ opacity: 0, x: 10, scale: 0.98 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 10, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <p className="px-1 text-xs uppercase tracking-wide text-neutral-400">Region</p>
                    <p className="mt-1 px-1 text-sm text-neutral-200">
                      Streaming and ratings use{" "}
                      <span className="font-semibold text-white">{tmdbCountryName(watchRegion)}</span>
                      {user?.country_code ? "" : " (default US — set yours in Profile)"}.
                    </p>
                    {!user?.country_code && (
                      <Link
                        to="/profile"
                        className="mt-2 inline-block px-1 text-xs font-semibold text-emerald-300 underline-offset-2 hover:underline"
                      >
                        Set country in Profile
                      </Link>
                    )}
                    <div className={`mt-3 ${dShowSearch ? "pointer-events-none opacity-45" : ""}`}>
                      <p className="px-1 text-xs uppercase tracking-wide text-neutral-400">Streaming services</p>
                      {watchProvidersCatalog.isLoading ? (
                        <p className="mt-2 px-1 text-xs text-neutral-500">Loading providers…</p>
                      ) : mergedProviderOptions.length === 0 ? (
                        <p className="mt-2 px-1 text-xs text-neutral-500">No provider list for this region.</p>
                      ) : (
                        <div className="mt-2 flex max-h-36 flex-wrap gap-1 overflow-y-auto pr-0.5">
                          {mergedProviderOptions.map((p) => {
                            const active = dSelectedWatchProviderIds.includes(p.provider_id);
                            return (
                              <button
                                key={p.provider_id}
                                type="button"
                                onClick={() => {
                                  setDSelectedWatchProviderIds((prev) =>
                                    prev.includes(p.provider_id)
                                      ? prev.filter((id) => id !== p.provider_id)
                                      : [...prev, p.provider_id],
                                  );
                                }}
                                className={`rounded-2xl px-2.5 py-1 text-left text-xs transition ${active ? "bg-white border border-white text-neutral-900" : "border border-neutral-600 text-neutral-300 hover:bg-neutral-700/60"}`}
                              >
                                {p.provider_name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <p className="mt-3 px-1 text-xs uppercase tracking-wide text-neutral-400">
                        Content rating ({certListType === "tv" ? "TV" : "Movies"}
                        {dFilterType === "all" ? " — movies only when type is All" : ""})
                      </p>
                      <select
                        value={dCertification}
                        onChange={(e) => setDCertification(e.target.value)}
                        className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 outline-none"
                      >
                        <option value="">Any rating</option>
                        {certOptionsForRegion.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      {certificationsCatalog.isLoading && (
                        <p className="mt-1 px-1 text-xs text-neutral-500">Loading ratings…</p>
                      )}
                      {(dSelectedWatchProviderIds.length > 0 || dCertification !== "") && (
                        <button
                          type="button"
                          onClick={() => {
                            setDSelectedWatchProviderIds([]);
                            setDCertification("");
                          }}
                          className="mt-2 w-full rounded-2xl border border-neutral-600 px-3 py-2 text-xs text-neutral-200 transition hover:bg-neutral-700/60"
                        >
                          Clear streaming &amp; rating filters
                        </button>
                      )}
                    </div>
                    {dShowSearch && (
                      <p className="mt-2 px-1 text-xs text-amber-200/90">
                        Streaming and content rating filters apply to Discovery browse, not while search is open.
                      </p>
                    )}
                    <p className="mt-4 px-1 text-xs uppercase tracking-wide text-neutral-400">Sort</p>
                    <div className="mt-1">
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                type="button"
                onClick={() => { setDShowSort((prev) => !prev); setDShowFilter(false); setDShowSearch(false); }}
                className={`${floatingActionButtonBaseClass} ${dSortBy !== "default" || dSelectedWatchProviderIds.length > 0 || dCertification !== "" ? "bg-emerald-500/80 border-emerald-400 text-white" : ""}`}
              >
                <AnimatedNavIcon>{sortButtonIcon(dSortBy)}</AnimatedNavIcon>
              </button>
            </div>

            <button
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
            >
              <AnimatedNavIcon>
                {dShowSearch ? <X size={24} strokeWidth={2.5} /> : <Search size={24} strokeWidth={2.5} />}
              </AnimatedNavIcon>
            </button>
          </div>
        </>
      )}

      {user && isSaved && (
        <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
          <div className="relative">
            <AnimatePresence>
              {sShowFilter && (
                <motion.div
                  className="fixed inset-x-4 bottom-24 z-[70] rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-3 backdrop-blur-md md:absolute md:right-full md:bottom-0 md:inset-x-auto md:mr-2 md:w-[30rem]"
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
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <label className="block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="saved-layout-min-rating">Min rating</label>
                      <select id="saved-layout-min-rating" value={sMinRating} onChange={(e) => setSMinRating(Number.parseInt(e.target.value, 10) as MinRating)} className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 outline-none">
                        <option value={0}>Any</option><option value={6}>6+</option><option value={7}>7+</option><option value={8}>8+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="saved-layout-watch-filter">Watch status</label>
                      <select
                        id="saved-layout-watch-filter"
                        value={sWatchedFilter}
                        onChange={(e) => setSWatchedFilter(e.target.value as WatchFilter)}
                        className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 outline-none"
                      >
                        <option value="all">All</option>
                        <option value="watched">Watched</option>
                        <option value="unwatched">Unwatched</option>
                      </select>
                    </div>
                    <div>
                      <label className="block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="saved-layout-year-from">Year from</label>
                      <input id="saved-layout-year-from" inputMode="numeric" value={sYearFrom} onChange={(e) => setSYearFrom(e.target.value.replace(/[^\d]/g, "").slice(0, 4))} placeholder="e.g. 2018" className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none" />
                    </div>
                    <div>
                      <label className="block px-1 text-xs uppercase tracking-wide text-neutral-400" htmlFor="saved-layout-favorite-filter">Favorite status</label>
                      <select
                        id="saved-layout-favorite-filter"
                        value={sFavoriteFilter}
                        onChange={(e) => setSFavoriteFilter(e.target.value as FavoriteFilter)}
                        className="mt-2 w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2 text-sm text-neutral-100 outline-none"
                      >
                        <option value="all">All</option>
                        <option value="favorited">Favorited</option>
                      </select>
                    </div>
                  </div>
                  <p className="mt-3 px-1 text-xs uppercase tracking-wide text-neutral-400">Genres</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(sFilterType === "tv" ? TV_GENRES : sFilterType === "movie" ? MOVIE_GENRES : ALL_GENRES).map((genre) => {
                      const active = sSelectedGenreIds.includes(genre.id);
                      return (
                        <button key={genre.id} type="button" onClick={() => setSSelectedGenreIds((prev) => prev.includes(genre.id) ? prev.filter((id) => id !== genre.id) : [...prev, genre.id])} className={`rounded-2xl px-2.5 py-1 text-xs transition ${active ? "bg-white border border-white text-neutral-900" : "border border-neutral-600 text-neutral-300 hover:bg-neutral-700/60"}`}>
                          {genre.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={() => { setSFilterType("all"); setSMinRating(0); setSWatchedFilter("all"); setSFavoriteFilter("all"); setSYearFrom(""); setSSelectedGenreIds([]); }} className="w-full rounded-2xl border border-neutral-600 px-3 py-2 text-sm text-neutral-200 transition hover:bg-neutral-700/60">
                      Clear filters
                    </button>
                    <button
                      type="button"
                      onClick={() => setSShowFilter(false)}
                      className="w-full rounded-2xl border-t border-neutral-500 bg-neutral-200 px-3 py-2 text-sm font-semibold text-neutral-900 transition hover:bg-white"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button type="button" onClick={() => { setSShowFilter((prev) => !prev); setSShowSort(false); setSShowFriends(false); }} className={`${floatingActionButtonBaseClass} ${sFilterType !== "all" || sMinRating !== 0 || sWatchedFilter !== "all" || sFavoriteFilter !== "all" || sYearFrom.trim() !== "" || sSelectedGenreIds.length > 0 ? "bg-emerald-500/80 border-emerald-400 text-white" : ""}`}>
              <AnimatedNavIcon>
                <Filter size={24} strokeWidth={2.5} />
              </AnimatedNavIcon>
            </button>
          </div>

          <div className="relative">
            <AnimatePresence>
              {sShowSort && (
                <motion.div
                  className="fixed inset-x-4 bottom-24 z-[70] max-h-[75vh] w-[min(26rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-3 backdrop-blur-md md:absolute md:right-full md:bottom-0 md:left-auto md:inset-x-auto md:mr-2 md:w-80"
                  initial={{ opacity: 0, x: 10, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.98 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <p className="px-1 text-xs uppercase tracking-wide text-neutral-400">Region</p>
                  <p className="mt-1 px-1 text-sm text-neutral-200">
                    Streaming uses{" "}
                    <span className="font-semibold text-white">{tmdbCountryName(watchRegion)}</span>
                    {user?.country_code ? "" : " (default US — set yours in Profile)"}.
                  </p>
                  {!user?.country_code && (
                    <Link
                      to="/profile"
                      className="mt-2 inline-block px-1 text-xs font-semibold text-emerald-300 underline-offset-2 hover:underline"
                    >
                      Set country in Profile
                    </Link>
                  )}
                  <div className="mt-3">
                    <p className="px-1 text-xs uppercase tracking-wide text-neutral-400">Streaming services</p>
                    {watchProvidersCatalog.isLoading ? (
                      <p className="mt-2 px-1 text-xs text-neutral-500">Loading providers…</p>
                    ) : mergedProviderOptions.length === 0 ? (
                      <p className="mt-2 px-1 text-xs text-neutral-500">No provider list for this region.</p>
                    ) : (
                      <div className="mt-2 flex max-h-36 flex-wrap gap-1 overflow-y-auto pr-0.5">
                        {mergedProviderOptions.map((p) => {
                          const active = sSelectedWatchProviderIds.includes(p.provider_id);
                          return (
                            <button
                              key={p.provider_id}
                              type="button"
                              onClick={() => {
                                setSSelectedWatchProviderIds((prev) =>
                                  prev.includes(p.provider_id)
                                    ? prev.filter((id) => id !== p.provider_id)
                                    : [...prev, p.provider_id],
                                );
                              }}
                              className={`rounded-2xl px-2.5 py-1 text-left text-xs transition ${active ? "bg-white border border-white text-neutral-900" : "border border-neutral-600 text-neutral-300 hover:bg-neutral-700/60"}`}
                            >
                              {p.provider_name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <p className="mt-3 px-1 text-xs text-neutral-500">
                      Content rating filters apply on <span className="text-neutral-300">Discovery</span> (open Sort
                      there). Here you can narrow Saved by where titles stream (up to 100 items after other filters).
                    </p>
                    {sSelectedWatchProviderIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSSelectedWatchProviderIds([]);
                        }}
                        className="mt-2 w-full rounded-2xl border border-neutral-600 px-3 py-2 text-xs text-neutral-200 transition hover:bg-neutral-700/60"
                      >
                        Clear streaming selection
                      </button>
                    )}
                  </div>
                  <p className="mt-4 px-1 text-xs uppercase tracking-wide text-neutral-400">Sort</p>
                  <div className="mt-1">
                    {[
                      { key: "default" as SortKind, label: "Default", icon: <ArrowUpDown size={15} /> },
                      { key: "title_asc" as SortKind, label: "Title A-Z", icon: <ArrowDownAZ size={15} /> },
                      { key: "title_desc" as SortKind, label: "Title Z-A", icon: <ArrowUpAZ size={15} /> },
                      { key: "rating_desc" as SortKind, label: "Rating high-low", icon: <Star size={15} /> },
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setSSortBy(opt.key)}
                        className={`mt-1 first:mt-0 flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition ${sSortBy === opt.key ? "bg-neutral-700/80 text-white" : "text-neutral-300 hover:bg-neutral-700/60"}`}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <button type="button" onClick={() => { setSShowSort((prev) => !prev); setSShowFilter(false); setSShowFriends(false); }} className={`${floatingActionButtonBaseClass} ${sSortBy !== "default" || sSelectedWatchProviderIds.length > 0 ? "bg-emerald-500/80 border-emerald-400 text-white" : ""}`}>
              <AnimatedNavIcon>{sortButtonIcon(sSortBy)}</AnimatedNavIcon>
            </button>
          </div>

          <div className="relative">
            <AnimatePresence>
              {sShowFriends && (
                <motion.div className="fixed inset-x-4 bottom-24 z-[70] max-h-[70vh] overflow-y-auto rounded-3xl border-t border-neutral-600 bg-neutral-800/90 p-3 backdrop-blur-md md:absolute md:right-full md:bottom-0 md:inset-x-auto md:mr-2 md:w-64" initial={{ opacity: 0, x: 10, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 10, scale: 0.98 }} transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}>
                  {friendsLoading ? (
                    <div className="flex max-w-64 gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div key={idx} className="w-20 shrink-0 rounded-2xl px-2 py-2">
                          <div className="mx-auto h-9 w-9 rounded-full bg-neutral-700/80 animate-pulse" />
                          <div className="mt-2 h-3 rounded bg-neutral-700/70 animate-pulse" />
                        </div>
                      ))}
                    </div>
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
                            <WatchTogetherUserStack
                              initialFrom={friend.name}
                              label={friend.name}
                              active={active}
                            />
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
            <button
              type="button"
              onClick={() => {
                setSShowFriends((prev) => !prev);
                setSShowFilter(false);
                setSShowSort(false);
                setShowFriendsSocial(false);
              }}
              className={`${floatingActionButtonBaseClass} ${selectedFriendIds.length > 0 ? "bg-emerald-500/80 border-emerald-400 text-white" : ""}`}
            >
              <AnimatedNavIcon>
                <Users size={24} strokeWidth={2.5} />
              </AnimatedNavIcon>
            </button>
          </div>

          <div
            className={`${floatingActionButtonBaseClass} pointer-events-none opacity-0`}
            aria-hidden
          >
            <User size={24} strokeWidth={2.5} />
          </div>
        </div>
      )}

      {user && (
        <footer className="fixed bottom-0 left-0 right-0 z-10 p-5 pointer-events-none">
          <nav className="mx-auto flex h-14 w-fit items-center gap-2 rounded-4xl border-t border-neutral-600 bg-neutral-800/80 px-2 backdrop-blur-md pointer-events-auto">
            {routes.map((route) => {
              const active = pathname === route.path;
              return (
                <Link
                  key={route.path}
                  to={route.path}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-3xl transition-colors ${
                    active
                      ? "text-neutral-100"
                      : "text-neutral-400"
                  }`}
                >
                  <AnimatedNavIcon>
                    <route.icon size={24} strokeWidth={2.5} className="relative z-10" />
                  </AnimatedNavIcon>
                </Link>
              );
            })}
          </nav>
        </footer>
      )}
    </div>
  );
};

export default MainLayout;
