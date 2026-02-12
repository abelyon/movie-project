import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    return <Navigate to="/discovery" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register(username, email, password, passwordConfirmation);
      navigate("/discovery");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-5 md:p-6 bg-[#252422] pb-[calc(6rem+env(safe-area-inset-bottom,0px))]">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 bg-[#403D39] rounded-[36px] p-5 sm:p-6 md:p-8"
        >
          {error && (
            <p className="text-red-400 text-sm font-space-grotesk bg-red-900/30 p-3 rounded-full">
              {error}
            </p>
          )}
          <div>
            <label className="block text-light-gray text-sm font-space-grotesk font-medium mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full p-3 rounded-full bg-[#252422] text-[#FFFCF2] font-space-grotesk focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-light-gray text-sm font-space-grotesk font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-full bg-[#252422] text-[#FFFCF2] font-space-grotesk focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-light-gray text-sm font-space-grotesk font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full p-3 rounded-full bg-[#252422] text-[#FFFCF2] font-space-grotesk focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
            />
          </div>
          <div>
            <label className="block text-light-gray text-sm font-space-grotesk font-medium mb-2">
              Confirm password
            </label>
            <input
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              className="w-full p-3 rounded-full bg-[#252422] text-[#FFFCF2] font-space-grotesk focus:outline-none focus:ring-2 focus:ring-amber-400 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-amber-400 text-black font-space-grotesk font-bold disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
          <p className="text-center text-light-gray text-sm font-space-grotesk">
            Already have an account?{" "}
            <Link to="/login" className="text-amber-400 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
