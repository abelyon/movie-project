import { ListFilter } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const SortBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [sorts, setSorts] = useState<string[]>([]);

  useEffect(() => {
    console.log(isClicked);
  }, [isClicked]);

  const handleSortClick = () => {
    setIsOpen(!isOpen);

    setIsClicked(true);
    setTimeout(() => {
      setIsClicked(false);
    }, 300);
  };

  const hanleClick = (genre: string) => {
    if (!sorts.includes(genre)) {
      setSorts([...sorts, genre]);
    }
    else {
      setSorts(sorts.filter((item) => item !== genre));
    }
  };

  useEffect(() => {
    console.log(sorts);
  }, [sorts]);

  const genres: string[] = [
    "Sci-fi",
    "Horror",
    "Action",
    "Drama",
    "Comedy",
    "Romance",
    "Thriller",
    "Fantasy",
    "Animation",
    "Documentary",
  ];
  return (
    <>
      <div
        className={`fixed bottom-0 mb-69 right-0 p-5 z-1 transition-all duration-500`}
      >
        {isOpen && (
          <div className="transition-all max-h-60 md:max-h-80 overflow-y-auto no-scrollbar">
            <div className="flex flex-col items-end gap-5">
              {genres.map((genre) => (
                <div
                  key={genre}
                  onClick={() => hanleClick(genre)}
                  className="w-fit px-4 py-2 bg-[#403D39] rounded-full text-center cursor-pointer"
                >
                  <p className={`transition-colors duration-300 font-space-grotesk font-medium text-lg ${sorts.includes(genre) ? "text-[#FFFCF2]" : "text-light-gray"}`}>
                    {genre}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-0 right-0 mb-46 p-5 z-1">
        <button
          className={`bg-[#403D39] rounded-full p-5 cursor-pointer transition-all duration-500 ${isClicked && "scale-95 rotate-2 translate-y-1 opacity-50"}`}
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
