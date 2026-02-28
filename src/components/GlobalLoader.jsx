import { motion, AnimatePresence } from "framer-motion";

export default function GlobalLoader({ busy, text }) {
  return (
    <AnimatePresence>
      {busy && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/45 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            className="rounded-2xl border border-white/20 bg-slate-900/90 px-8 py-6 text-center shadow-2xl"
          >
            <motion.div
              className="mx-auto h-14 w-14 rounded-full border-4 border-primary border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="mt-4 text-sm text-slate-100">{text || "Working..."}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
