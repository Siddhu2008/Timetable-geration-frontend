import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";

export default function AppLayout() {
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("theme");
    return stored !== null ? stored === "dark" : true; // default dark
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync dark class to <html> element whenever dark changes
  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.remove("dark");
      html.classList.add("light");
    }
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="min-h-screen">
      <div className="flex" style={{ backgroundColor: "var(--color-bg)" }}>
        {/* Sidebar — always show on desktop */}
        <Sidebar dark={dark} setDark={setDark} />

        {/* Mobile Header */}
        <div className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b px-4 backdrop-blur-xl lg:hidden"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
        >
          <h1 className="royal-header font-heading text-xl font-bold">Smart Timetable</h1>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 transition"
            style={{ color: "var(--color-text)", backgroundColor: "var(--color-surface-hover)" }}
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 min-w-0 w-full lg:w-[calc(100%-16rem)]">
          <div className="mx-auto min-h-screen p-4 pt-24 pb-20 lg:p-10 lg:pt-10">
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-[1600px] w-full mx-auto"
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="h-full w-64 p-6 shadow-2xl"
              style={{ backgroundColor: "var(--color-bg-2)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <Sidebar dark={dark} setDark={setDark} mobile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
