import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen p-4 sm:p-5 md:p-6 bg-[#252422] pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#403D39] rounded-[36px] p-5 sm:p-6 md:p-8 max-w-md">
          <p className="text-light-gray text-sm font-space-grotesk font-medium mb-1">Name</p>
          <p className="text-[#FFFCF2] text-xl font-space-grotesk font-bold mb-4">
            {user?.name}
          </p>
          <p className="text-light-gray text-sm font-space-grotesk font-medium mb-1">Email</p>
          <p className="text-[#FFFCF2] text-xl font-space-grotesk font-bold mb-6">
            {user?.email}
          </p>
          <button
            onClick={handleLogout}
            className="w-full py-3 rounded-full bg-[#252422] text-[#FFFCF2] font-space-grotesk font-bold transition-colors hover:bg-[#363432]"
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
