import { Navigate, Route, Routes } from "react-router-dom"
import Saved from "../pages/Saved/Saved"
import Profile from "../pages/Profile/Profile"
import MainLayout from "./layout/MainLayout"
import DiscoveryPage from "../pages/Discovery/DiscoveryPage"
import Detail from "../pages/Detail/DetailPage"

const AppRoutes = () => {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/discovery" />} />
                <Route path="/discovery" element={<DiscoveryPage />} />
                <Route path="/discovery/:type/:id" element={<Detail />} />
                <Route path="/saved" element={<Saved />} />
                <Route path="/profile" element={<Profile />} />
            </Route>
        </Routes>
    )
}

export default AppRoutes;