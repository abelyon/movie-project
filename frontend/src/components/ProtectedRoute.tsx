import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { MainLayoutOutletContext } from "../layout/MainLayout";

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const { pathname } = useLocation();
  const outletContext = useOutletContext<MainLayoutOutletContext | undefined>();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isVerified = !!user.email_verified_at;
  if (!isVerified && pathname !== "/profile") {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet context={outletContext} />;
};

export default ProtectedRoute;
