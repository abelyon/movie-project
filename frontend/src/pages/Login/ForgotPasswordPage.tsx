import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSuccess("If that email exists, we sent a reset link.");
    } catch (err: unknown) {
      const res = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
        : null;
      const msg = res?.message ?? (res?.errors ? Object.values(res.errors).flat()[0] : null) ?? "Could not send reset link";
      setError(typeof msg === "string" ? msg : "Could not send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-4xl border-t border-neutral-600 bg-neutral-800/80 p-6 backdrop-blur-md sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-space-grotesk font-bold text-neutral-100">Reset password</h1>
            <p className="mt-1 text-sm text-neutral-400">Enter your email and we will send a reset link.</p>
          </div>
          {error && (
            <p className="rounded-2xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
          {success && (
            <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300">{success}</p>
          )}
          <div>
            <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-neutral-400"
              placeholder="you@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-2xl border-t border-neutral-500 bg-neutral-200 px-4 py-2.5 font-space-grotesk font-semibold text-neutral-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-neutral-400">
          Back to{" "}
          <Link to="/login" className="text-neutral-200 underline-offset-4 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;

