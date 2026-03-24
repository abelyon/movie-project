import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl bg-neutral-800/70 p-6 animate-pulse">
          <div className="h-6 w-32 rounded bg-neutral-700/80" />
          <div className="mt-4 h-4 w-full rounded bg-neutral-700/70" />
          <div className="mt-2 h-4 w-5/6 rounded bg-neutral-700/70" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
