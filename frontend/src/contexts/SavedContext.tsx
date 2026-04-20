import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { api } from "../services/api";

interface SavedContextType {
  savedIds: Set<string>;
  isLoading: boolean;
  toggleSaved: (mediaType: string, tmdbId: number) => Promise<void>;
  refetchSaved: () => Promise<void>;
}

const SavedContext = createContext<SavedContextType | null>(null);

export function SavedProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const refetchSaved = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedIds(new Set());
      return;
    }
    setIsLoading(true);
    try {
      const data = await api.getSaved();
      const ids = new Set<string>(
        (data.saved ?? []).map(
          (f: { media_type: string; tmdb_id: number }) =>
            `${f.media_type}-${f.tmdb_id}`
        )
      );
      setSavedIds(ids);
    } catch {
      setSavedIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refetchSaved();
  }, [refetchSaved]);

  const toggleSaved = useCallback(
    async (mediaType: string, tmdbId: number) => {
      if (!isAuthenticated) return;
      try {
        await api.toggleSaved(mediaType, tmdbId);
        await refetchSaved();
      } catch {
      }
    },
    [isAuthenticated, refetchSaved]
  );

  return (
    <SavedContext.Provider
      value={{ savedIds, isLoading, toggleSaved, refetchSaved }}
    >
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within SavedProvider");
  return ctx;
}
