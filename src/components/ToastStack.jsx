import { AnimatePresence, motion } from "framer-motion";

const styleByType = {
  success: "bg-emerald-600 text-white",
  error: "bg-rose-600 text-white",
  warning: "bg-amber-500 text-slate-900",
  info: "bg-slate-800 text-white"
};

export default function ToastStack({ toasts }) {
  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            className={`pointer-events-auto rounded-xl px-4 py-3 text-sm shadow-xl ${styleByType[t.type] || styleByType.info}`}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
