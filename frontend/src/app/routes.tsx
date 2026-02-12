import { Navigate, Route, Routes } from "react-router-dom";
import Saved from "../pages/Saved/Saved";
import Profile from "../pages/Profile/Profile";
import MainLayout from "./layout/MainLayout";
import DiscoveryPage from "../pages/Discovery/DiscoveryPage";
import Detail from "../pages/Detail/DetailPage";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";
import ProtectedRoute from "../components/ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/discovery" replace />} />
        <Route path="/discovery" element={<DiscoveryPage />} />
        <Route path="/discovery/:type/:id" element={<Detail />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
