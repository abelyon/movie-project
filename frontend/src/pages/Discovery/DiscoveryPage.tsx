import { useCallback, useEffect, useState } from "react";
import SearchBar from "./components/SearchBar";
import MovieGrid from "./components/MediaContainer";
import SortBar from "./components/SortBar";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../services/api";
import type { TmdbGenreOption } from "../../types/tmdb";

const DiscoveryPage = () => {
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
    const [genres, setGenres] = useState<TmdbGenreOption[]>([]);
    const [selectedGenreIds, setSelectedGenreIds] = useState<number[]>([]);
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getGenres();
                setGenres(data.genres ?? []);
            } catch {
                setGenres([]);
            }
        };
        load();
    }, []);

    const fetchSaved = useCallback(async () => {
        if (!isAuthenticated) {
            setSavedIds(new Set());
            return;
        }
        try {
            const data = await api.getFavourites();
            const ids = new Set(
                (data.favourites ?? []).map(
                    (f: { media_type: string; tmdb_id: number }) =>
                        `${f.media_type}-${f.tmdb_id}`
                )
            );
            setSavedIds(ids);
        } catch {
            setSavedIds(new Set());
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchSaved();
    }, [fetchSaved]);

    return (
        <div className="min-h-screen bg-[#252422]">
            <SortBar
                genres={genres}
                selectedGenreIds={selectedGenreIds}
                onGenreIdsChange={setSelectedGenreIds}
            />
            <SearchBar
                value={search}
                onChange={setSearch}
                onDebouncedChange={setDebouncedSearch}
            />
            <MovieGrid
                searchQuery={debouncedSearch}
                genreIds={selectedGenreIds}
                savedIds={savedIds}
                onSavedChange={fetchSaved}
            />
        </div>
    );
};

export default DiscoveryPage;