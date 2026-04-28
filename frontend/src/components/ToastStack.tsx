import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { APP_TOAST_EVENT, type AppToastPayload } from "../utils/toastBus";

type ToastItem = AppToastPayload & { id: number };

const MAX_TOASTS = 4;
const TOAST_TTL_MS = 4500;

const toneClass = (type: AppToastPayload["type"]): string => {
  if (type === "error") return "border-red-400/50 bg-red-500/20 text-red-100";
  if (type === "warning") return "border-amber-400/50 bg-amber-500/20 text-amber-100";
  return "border-neutral-500/60 bg-neutral-800/90 text-neutral-100";
};

const ToastStack = () => {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    let idSeed = 1;
    const onToast = (event: Event) => {
      const customEvent = event as CustomEvent<AppToastPayload>;
      const payload = customEvent.detail;
      if (!payload?.title) return;

      const id = idSeed++;
      setItems((prev) => [{ id, ...payload }, ...prev].slice(0, MAX_TOASTS));

      window.setTimeout(() => {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }, TOAST_TTL_MS);
    };

    window.addEventListener(APP_TOAST_EVENT, onToast as EventListener);
    return () => window.removeEventListener(APP_TOAST_EVENT, onToast as EventListener);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 left-1/2 z-[120] flex w-[min(92vw,24rem)] -translate-x-1/2 flex-col gap-2">
      <AnimatePresence initial={false}>
        {items.map((toast) => (
          <motion.div
          key={toast.id}
          className={`rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur-md ${toneClass(toast.type)}`}
          initial={{ opacity: 0, y: -18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          layout
          >
            <p className="font-space-grotesk font-semibold">{toast.title}</p>
            {toast.message ? <p className="mt-1 text-xs opacity-95">{toast.message}</p> : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastStack;
