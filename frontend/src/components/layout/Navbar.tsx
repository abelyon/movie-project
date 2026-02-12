import { User, Bookmark, Compass, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Navbar = () => {
    const { isAuthenticated } = useAuth();
    const navItems = [
        {
            path: isAuthenticated ? "/profile" : "/login",
            icon: User,
        },
        {
            path: "/discovery",
            icon: Compass,
        },
        {
            path: "/saved",
            icon: Bookmark,
        },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] gap-4 sm:gap-5">
            <div className="bg-[#403D39] rounded-full">
                <div className="flex justify-center p-4 sm:p-5 gap-6 sm:gap-8">
                    {navItems.map((item) => (
                        <NavItem key={item.path} path={item.path} icon={item.icon} />
                    ))}
                </div>
            </div>
        </div>
    )
}

interface NavItemProps {
    path: string;
    icon: LucideIcon;
}

const NavItem = ({ path, icon: Icon }: NavItemProps) => {
    const location = useLocation();
    const isActive = location.pathname === path;
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = () => {
        setIsClicked(true);
        setTimeout(() => {
            setIsClicked(false);
        }, 300);
    }

    return (
        <Link
            to={path}
            className={`flex items-center justify-center w-full transition-all duration-500 ${isClicked && "scale-95 rotate-4 opacity-50"} ${
                isActive ? "text-white" : "text-light-gray"
            }`}
            onClick={handleClick}
        >
            <Icon size={32} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        </Link>
    );
};

export default Navbar;