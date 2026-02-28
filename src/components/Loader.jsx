import { motion } from "framer-motion";

export default function Loader({ text = "Processing..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <motion.div
        className="h-14 w-14 rounded-full border-4 border-primary border-t-transparent"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      <p className="text-sm text-slate-600 dark:text-slate-300">{text}</p>
    </div>
  );
}
