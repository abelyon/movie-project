import { ListFilter } from "lucide-react";
import { useMemo, useState } from "react";
import type { TmdbGenreOption } from "../../../types/tmdb";

interface SortBarProps {
  genres: TmdbGenreOption[];
  selectedGenreIds: number[];
  onGenreIdsChange: (ids: number[]) => void;
}

const SortBar = ({ genres, selectedGenreIds, onGenreIdsChange }: SortBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const handleSortClick = () => {
    setIsOpen(!isOpen);
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
  };

  const uniqueNamesWithIds = useMemo(() => {
    const byName = new Map<string, number[]>();
    for (const g of genres) {
      const name = g.name;
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name)!.push(g.id);
    }
    return Array.from(byName.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [genres]);

  const handleGenreClick = (name: string) => {
    const ids = uniqueNamesWithIds.find(([n]) => n === name)?.[1] ?? [];
    const current = new Set(selectedGenreIds);
    const anySelected = ids.some((id) => current.has(id));
    if (anySelected) {
      ids.forEach((id) => current.delete(id));
    } else {
      ids.forEach((id) => current.add(id));
    }
    onGenreIdsChange(Array.from(current));
  };

  const isGenreActive = (name: string) => {
    const ids = uniqueNamesWithIds.find(([n]) => n === name)?.[1] ?? [];
    return ids.some((id) => selectedGenreIds.includes(id));
  };

  return (
    <>
      <div
        className="fixed bottom-0 right-0 z-10 p-4 sm:p-5 mb-[calc(15rem+env(safe-area-inset-bottom,0px))] sm:mb-[calc(15.5rem+env(safe-area-inset-bottom,0px))] transition-all duration-500"
      >
        {isOpen && (
          <div className="transition-all max-h-48 sm:max-h-60 md:max-h-80 overflow-y-auto no-scrollbar">
            <div className="flex flex-col items-end gap-5">
              {uniqueNamesWithIds.map(([genreName]) => (
                <div
                  key={genreName}
                  onClick={() => handleGenreClick(genreName)}
                  className="w-fit px-4 py-2 bg-[#403D39] rounded-full text-center cursor-pointer"
                >
                  <p
                    className={`transition-colors duration-300 font-space-grotesk font-medium text-lg ${isGenreActive(genreName) ? "text-[#FFFCF2]" : "text-light-gray"}`}
                  >
                    {genreName}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-0 right-0 z-10 p-4 sm:p-5 mb-[calc(10rem+env(safe-area-inset-bottom,0px))] sm:mb-[calc(10.5rem+env(safe-area-inset-bottom,0px))]">
        <button
          className={`bg-[#403D39] rounded-full p-4 sm:p-5 cursor-pointer transition-all duration-500 min-w-[44px] min-h-[44px] flex items-center justify-center ${isClicked && "scale-95 rotate-2 translate-y-1 opacity-50"}`}
          onPointerDown={(e) => e.preventDefault()}
          onClick={handleSortClick}
        >
          <ListFilter
            size={32}
            strokeWidth={2.5}
            className={`transition-colors duration-500 ${isOpen ? "text-[#FFFCF2]" : "text-light-gray"}`}
          />
        </button>
      </div>
    </>
  );
};

export default SortBar;
