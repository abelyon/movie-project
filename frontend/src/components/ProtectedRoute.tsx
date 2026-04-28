import { Navigate, Outlet, useOutletContext } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import type { MainLayoutOutletContext } from "../layout/MainLayout";

const ProtectedRoute = () => {
  const { user, isLoading } = useAuth();
  const outletContext = useOutletContext<MainLayoutOutletContext | undefined>();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet context={outletContext} />;
};

export default ProtectedRoute;
