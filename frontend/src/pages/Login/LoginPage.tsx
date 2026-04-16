import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/discovery", { replace: true });
    } catch (err: unknown) {
      const res = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
        : null;
      const msg = res?.message ?? (res?.errors ? Object.values(res.errors).flat()[0] : null) ?? "Login failed";
      setError(typeof msg === "string" ? msg : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-4xl border-t border-neutral-600 bg-neutral-800/80 p-6 backdrop-blur-md sm:p-8">
        <h1 className="text-2xl font-space-grotesk font-bold text-neutral-100">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-400">Sign in to continue browsing movies and shows.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {error && (
            <p className="rounded-2xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-neutral-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-neutral-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-2xl border-t border-neutral-500 bg-neutral-200 px-4 py-2.5 font-space-grotesk font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-neutral-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-neutral-200 underline-offset-4 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
