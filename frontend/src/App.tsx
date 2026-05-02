import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import GuestRoute from "./components/GuestRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layout/MainLayout";
import DiscoveryPage from "./pages/Discovery/DiscoveryPage";
import LoginPage from "./pages/Login/LoginPage";
import ForgotPasswordPage from "./pages/Login/ForgotPasswordPage";
import RegisterPage from "./pages/Register/RegisterPage";
import ResetPasswordPage from "./pages/Login/ResetPasswordPage";
import SavedPage from "./pages/Saved/SavedPage";
import DetailPage from "./pages/Detail/DetailPage";
import PersonDetailPage from "./pages/People/PersonDetailPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import RealtimeBridge from "./realtime/RealtimeBridge";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <RealtimeBridge />
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route element={<ProtectedRoute />}>
                <Route index element={<Navigate to="/discovery" replace />} />
                <Route path="discovery" element={<DiscoveryPage />} />
                <Route path="person/:id" element={<PersonDetailPage />} />
                <Route path=":media_type/:id" element={<DetailPage />} />
                <Route path="saved" element={<SavedPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
              <Route element={<GuestRoute />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
                <Route path="register" element={<RegisterPage />} />
              </Route>
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
