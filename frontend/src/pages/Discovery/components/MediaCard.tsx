import { forwardRef } from "react";
import { Link } from "react-router-dom";
import type { TmdbMedia } from "../../../types/tmdb";
import SavedButton from "./SavedButton";

interface MediaCardProps {
  item: TmdbMedia;
  isSaved?: boolean;
  onSavedChange?: () => void;
}

const MediaCard = forwardRef<HTMLDivElement, MediaCardProps>(
  ({ item, isSaved = false, onSavedChange }, ref) => {
    const posterUrl = item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : "/placeholder.png";

    const type = item.media_type === "tv" ? "tv" : "movie";
    const certification = item.certification ?? null;

    return (
      <div ref={ref} className="relative">
        <Link to={`/discovery/${type}/${item.id}`} className="block">
          <div className="relative w-full aspect-2/3 rounded-[36px] overflow-hidden">
            <img
              src={posterUrl}
              alt={item.title ?? item.name ?? ""}
              className="w-full h-full object-cover"
            />
            {certification && (
              <div className="absolute top-0 right-0 m-5 rounded-full px-4 py-2 bg-amber-400 flex items-center justify-center">
                <span className="text-xl text-black font-space-grotesk font-bold">
                  {certification}
                </span>
              </div>
            )}
            <SavedButton
              item={item}
              isSaved={isSaved}
              onToggle={onSavedChange}
            />
          </div>
        </Link>
      </div>
    );
  },
);

export default MediaCard;
