import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

type ToastItem = { id: string; message: string; variant: ToastVariant };

const MAX_TOASTS = 6;
const DEFAULT_DURATION_MS = 4_500;

type ToastContextValue = {
  pushToast: (opts: {
    message: string;
    variant?: ToastVariant;
    /** 0 = no auto-dismiss */
    durationMs?: number;
  }) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (opts: { message: string; variant?: ToastVariant; durationMs?: number }) => {
      const id = crypto.randomUUID();
      const variant = opts.variant ?? "success";
      const durationMs =
        opts.durationMs === undefined ? DEFAULT_DURATION_MS : opts.durationMs;
      setToasts((prev) => {
        const next: ToastItem[] = [{ id, message: opts.message, variant }, ...prev];
        return next.slice(0, MAX_TOASTS);
      });
      if (durationMs > 0) {
        window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
      }
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ pushToast, dismissToast }}>
      {children}
      <div
        className="pointer-events-none fixed top-4 left-1/2 z-[200] flex w-[min(100%-2rem,28rem)] -translate-x-1/2 flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions text"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="pointer-events-auto"
            >
              <div
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 font-space-grotesk text-sm shadow-lg backdrop-blur-md ${
                  t.variant === "success"
                    ? "border-emerald-400/35 bg-emerald-950/92 text-emerald-50"
                    : t.variant === "error"
                      ? "border-red-400/35 bg-red-950/92 text-red-50"
                      : "border-neutral-500/40 bg-neutral-900/95 text-neutral-100"
                }`}
              >
                {t.variant === "success" ? (
                  <CheckCircle className="mt-0.5 shrink-0 text-emerald-400" size={18} aria-hidden />
                ) : t.variant === "error" ? (
                  <AlertCircle className="mt-0.5 shrink-0 text-red-400" size={18} aria-hidden />
                ) : (
                  <Info className="mt-0.5 shrink-0 text-neutral-400" size={18} aria-hidden />
                )}
                <p className="min-w-0 flex-1 leading-snug">{t.message}</p>
                <button
                  type="button"
                  onClick={() => dismissToast(t.id)}
                  className="shrink-0 rounded-lg p-1 text-current opacity-70 transition hover:opacity-100"
                  aria-label="Dismiss notification"
                >
                  <X size={16} strokeWidth={2} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
