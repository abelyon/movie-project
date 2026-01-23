import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onSearch: () => void;
}

const SearchBar = ({ value, onChange, onSearch }: SearchBarProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);
    const [isClicked, setIsClicked] = useState(false);

    useEffect(() => {
        console.log(isClicked);
    }, [isClicked]);

    const handleSearchClick = () => {
        inputRef.current?.focus();
        setIsFocused(true);
        setIsClicked(true);
       setTimeout(() => {
        setIsClicked(false);
       }, 300);
        setIsPulsing(true);
        onSearch();
    }

    const handleInputChange = (value: string) => {
        onChange(value);
        setIsPulsing(false);
        onSearch();
    }

    const handleBlur = () => {
        setIsFocused(false);
        setIsPulsing(false);
    }

    return (
        <>
            <div className="flex justify-center items-center p-5">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search..."
                    className={`p-5 text-[#FFFCF2] font-space-grotesk font-bold bg-[#403D39] rounded-full outline-none text-2xl w-full transition-all duration-500 ${isPulsing && "animate-pulse"}`}
                    value={value}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => handleBlur()}
                />
            </div>
            <div className="fixed bottom-0 right-0 mb-23 p-5">
                <button
                    className={`bg-[#403D39] rounded-full p-5 cursor-pointer transition-all duration-500 ${isClicked && "scale-95 rotate-2 translate-y-1 opacity-50"}`}
                    disabled={isFocused}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={handleSearchClick}>
                    <Search size={32} strokeWidth={2.5} className={`transition-colors duration-500 ${isFocused ? "text-[#FFFCF2]" : "text-gray-400"}`} />
                </button>
            </div>
        </>
    )
}

export default SearchBar