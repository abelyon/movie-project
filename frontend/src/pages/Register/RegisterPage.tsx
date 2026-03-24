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
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg bg-neutral-800 p-6 shadow-lg">
        <h1 className="mb-6 text-xl font-semibold text-white">Create account</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded bg-red-500/20 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <div>
            <label htmlFor="register-name" className="mb-1 block text-sm text-neutral-400">
              Name
            </label>
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full rounded border border-neutral-600 bg-neutral-700 px-3 py-2 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="register-email" className="mb-1 block text-sm text-neutral-400">
              Email
            </label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded border border-neutral-600 bg-neutral-700 px-3 py-2 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="mb-1 block text-sm text-neutral-400">
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
              className="w-full rounded border border-neutral-600 bg-neutral-700 px-3 py-2 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="register-password-confirm" className="mb-1 block text-sm text-neutral-400">
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
              className="w-full rounded border border-neutral-600 bg-neutral-700 px-3 py-2 text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
