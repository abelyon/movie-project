import { forwardRef, use, useEffect } from "react";
import type { TmdbMedia } from "../../../types/tmdb";
import { PcCase } from "lucide-react";

interface MediaCardProps {
  item: TmdbMedia;
}

const MediaCard = forwardRef<HTMLDivElement, MediaCardProps>(
  ({ item }, ref) => {
    const posterUrl = item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : "/placeholder.png";

    const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
    return (
      <div ref={ref} className="relative">
        <img
          src={posterUrl}
          alt={item.title ?? item.name}
          className="w-full h-full object-cover rounded-[36px]"
        />

        <div className="absolute top-0 right-0 p-5">
          <div className=" bg-amber-300 rounded-full">
            <p className="text-black font-bold font-space-grotesk text-[22px] px-3 py-1">
              {rating}
            </p>
          </div>
        </div>
      </div>
    );
  },
);

export default MediaCard;
