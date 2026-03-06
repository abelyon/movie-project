import { Outlet } from "react-router-dom"
import Navbar from "../../components/Navbar"

const MainLayout = () => {
    return (
        <div>
            <Outlet />
            <Navbar />
        </div>
    )
}   

export default MainLayout;