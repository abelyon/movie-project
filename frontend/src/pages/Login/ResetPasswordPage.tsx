import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../api/auth";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const emailFromQuery = searchParams.get("email") ?? "";
  const hasResetParams = useMemo(() => token !== "" && emailFromQuery !== "", [emailFromQuery, token]);

  const [email, setEmail] = useState(emailFromQuery);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      navigate("/login", { replace: true });
    } catch (err: unknown) {
      const res = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data
        : null;
      const msg = res?.message ?? (res?.errors ? Object.values(res.errors).flat()[0] : null) ?? "Could not reset password";
      setError(typeof msg === "string" ? msg : "Could not reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!hasResetParams) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-4xl border-t border-neutral-600 bg-neutral-800/80 p-6 text-neutral-300 backdrop-blur-md sm:p-8">
          <p>Invalid password reset link.</p>
          <p className="mt-3">
            Request a new one from{" "}
            <Link to="/forgot-password" className="text-neutral-100 underline-offset-4 hover:underline">
              forgot password
            </Link>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-4xl border-t border-neutral-600 bg-neutral-800/80 p-6 backdrop-blur-md sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-space-grotesk font-bold text-neutral-100">Set new password</h1>
            <p className="mt-1 text-sm text-neutral-400">Choose a new password for your account.</p>
          </div>
          {error && (
            <p className="rounded-2xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
          <div>
            <label htmlFor="reset-email" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-neutral-600 bg-neutral-900/70 px-3 py-2.5 text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-neutral-400"
            />
          </div>
          <div>
            <label htmlFor="reset-password" className="mb-1.5 block text-sm font-medium text-neutral-300">
              New password
            </label>
            <input
              id="reset-password"
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
            <label htmlFor="reset-password-confirm" className="mb-1.5 block text-sm font-medium text-neutral-300">
              Confirm new password
            </label>
            <input
              id="reset-password-confirm"
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
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

