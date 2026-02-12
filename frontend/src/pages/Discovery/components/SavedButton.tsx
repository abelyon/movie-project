import { useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../services/api";
import type { TmdbMedia } from "../../../types/tmdb";
import SaveIcon from "../../../components/SaveIcon";

interface SavedButtonProps {
  item: TmdbMedia;
  isSaved: boolean;
  onToggle?: () => void;
  variant?: "card" | "inline" | "icon";
}

const SavedButton = ({ item, isSaved, onToggle, variant = "card" }: SavedButtonProps) => {
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || loading) return;
    setLoading(true);
    try {
      await api.toggleFavourite(item.media_type, item.id);
      onToggle?.();
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  const baseClass =
    variant === "card"
      ? "absolute bottom-0 right-0 m-5 py-2 px-4 rounded-full flex items-center justify-center bg-[#1E1E1E]/80 transition-colors"
      : variant === "icon"
        ? "rounded-full transition-colors text-amber-400 p-2"
        : "flex items-center gap-2 px-4 py-2 rounded-lg bg-[#403D39] transition-colors";

  const strokeColor = variant === "card" ? "#FFC107" : "currentColor";
  const fillColor =
    variant === "card" && isSaved
      ? "#FFC107"
      : variant === "icon" && isSaved
        ? "currentColor"
        : "none";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${baseClass} transition-colors disabled:opacity-50`}
      aria-label={isSaved ? "Remove from saved" : "Save"}
    >
      <SaveIcon
        size={variant === "card" ? 26 : 28}
        strokeWidth={isSaved ? 0 : 2.5}
        stroke={strokeColor}
        fill={fillColor}
      />
      {variant === "inline" && (
        <span className="text-[#FFFCF2] font-medium">
          {isSaved ? "Saved" : "Save"}
        </span>
      )}
    </button>
  );
};

export default SavedButton;
