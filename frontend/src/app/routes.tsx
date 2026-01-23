import { Navigate, Route, Routes } from "react-router-dom"
import Saved from "../pages/Saved/Saved"
import DiscoveryDetail from "../pages/DiscoveryDetail/DiscoveryDetail"
import Profile from "../pages/Profile/Profile"
import MainLayout from "./layout/MainLayout"
import DiscoveryPage from "../pages/Discovery/DiscoveryPage"

const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/discovery" />} />
                <Route path="/discovery" element={<DiscoveryPage />} />
                <Route path="/discovery/:type/:id" element={<DiscoveryDetail />} />
                <Route path="/saved" element={<Saved />} />
                <Route path="/profile" element={<Profile />} />
            </Route>
        </Routes>
    )
}

export default AppRoutes;