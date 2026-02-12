import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const DEBOUNCE_MS = 400;

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onDebouncedChange: (value: string) => void;
}

const SearchBar = ({ value, onChange, onDebouncedChange }: SearchBarProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);
    const [isClicked, setIsClicked] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            onDebouncedChange(value);
        }, DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [value, onDebouncedChange]);

    const handleSearchClick = () => {
        inputRef.current?.focus();
        setIsFocused(true);
        setIsClicked(true);
        setTimeout(() => setIsClicked(false), 300);
        setIsPulsing(true);
        onDebouncedChange(value);
    }

    const handleInputChange = (newValue: string) => {
        onChange(newValue);
        setIsPulsing(false);
    }

    const handleBlur = () => {
        setIsFocused(false);
        setIsPulsing(false);
    }

    return (
        <>
            <div className="flex justify-center items-center p-4 sm:p-5 max-w-2xl mx-auto">
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search..."
                    className={`p-4 sm:p-5 text-[#FFFCF2] font-space-grotesk font-bold bg-[#403D39] rounded-full outline-none text-lg sm:text-2xl w-full transition-all duration-500 ${isPulsing && "animate-pulse"}`}
                    value={value}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => handleBlur()}
                />
            </div>
            <div className="fixed bottom-0 right-0 z-10 p-4 sm:p-5 mb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:mb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
                <button
                    className={`bg-[#403D39] rounded-full p-4 sm:p-5 cursor-pointer transition-all duration-500 min-w-[44px] min-h-[44px] flex items-center justify-center ${isClicked && "scale-95 rotate-2 translate-y-1 opacity-50"}`}
                    disabled={isFocused}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={handleSearchClick}>
                    <Search size={28} strokeWidth={2.5} className={`transition-colors duration-500 ${isFocused ? "text-[#FFFCF2]" : "text-light-gray"}`} />
                </button>
            </div>
        </>
    )
}

export default SearchBar