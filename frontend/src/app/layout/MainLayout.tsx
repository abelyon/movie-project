import { Outlet } from "react-router-dom"
import Navbar from "../../components/layout/Navbar"

const MainLayout = () => {
    return (
        <div>
            <Outlet />
            <Navbar />
        </div>
    )
}   

export default MainLayout;