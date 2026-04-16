import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirmation) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, password_confirmation: passwordConfirmation });
      navigate("/discovery", { replace: true });
    } catch (err: unknown) {
      const res = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
        : null;
      const msg = res?.message ?? (res?.errors ? Object.values(res.errors).flat()[0] : null) ?? "Registration failed";
      setError(typeof msg === "string" ? msg : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-4xl border-t border-neutral-600 bg-neutral-800/80 p-6 backdrop-blur-md sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-space-grotesk font-bold text-neutral-100">Create account</h1>
            <p className="mt-1 text-sm text-neutral-400">Join and start saving what you want to watch.</p>
          </div>
          {error && (
            <p className="rounded-2xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
          <div>
            <label htmlFor="register-name" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Name
            </label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-neutral-400"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Email
            </label>
            <input
              id="register-email"
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
            <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Password
            </label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-neutral-400"
            />
          </div>
          <div>
            <label htmlFor="register-password-confirm" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Confirm password
            </label>
            <input
              id="register-password-confirm"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-neutral-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-2xl border-t border-neutral-500 bg-neutral-200 px-4 py-2.5 font-space-grotesk font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link to="/login" className="text-neutral-200 underline-offset-4 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
