import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Bookmark, Compass, User } from "lucide-react";
import { motion } from "motion/react";

const routes = [
  { path: "/profile", icon: User },
  { path: "/discovery", icon: Compass },
  { path: "/saved", icon: Bookmark },
];

const MainLayout = () => {
  const { user } = useAuth();

  const { pathname } = useLocation();

  return (
    <div className="relative isolate flex min-h-screen flex-col bg-neutral-900">
      <div
        className="pointer-events-none fixed inset-0 opacity-35"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(163,163,163,0.2) 1px, transparent 0)",
          backgroundSize: "20px 20px",
          backgroundPosition: "center center",
        }}
      />
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>
      {user && (
        <footer className="fixed bottom-0 left-0 right-0 z-10 p-5 pointer-events-none">
          <nav className="mx-auto flex h-14 w-fit items-center gap-2 rounded-4xl border-t border-neutral-600 bg-neutral-800/80 px-2 backdrop-blur-md pointer-events-auto">
            {routes.map((route) => {
              const active = pathname === route.path;
              return (
                <motion.div key={route.path} whileHover={{ scale: 1.08, rotate: 2 }} whileTap={{ scale: 0.94, rotate: -10 }}>
                  <Link
                    to={route.path}
                    className={`relative flex h-12 w-12 items-center justify-center rounded-3xl transition-colors ${
                      active
                        ? "text-neutral-100"
                        : "text-neutral-400 hover:text-neutral-200"
                    }`}
                  >
                    <route.icon size={24} strokeWidth={2.5} className="relative z-10" />
                  </Link>
                </motion.div>
              );
            })}
          </nav>
        </footer>
      )}
    </div>
  );
};

export default MainLayout;
