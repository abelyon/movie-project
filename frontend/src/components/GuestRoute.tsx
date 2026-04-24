import { Navigate, Outlet, useOutletContext } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const GuestRoute = () => {
  const { user, isLoading } = useAuth();
  const outletContext = useOutletContext();

  if (isLoading) {
    return null;
  }

  if (user) {
    return <Navigate to="/discovery" replace />;
  }

  return <Outlet context={outletContext} />;
};

export default GuestRoute;
