import { useAuth } from "../context/AuthContext";

export default function Navbar({ dark, setDark }) {
  const { user, logout } = useAuth();
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 px-4 py-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <h1 className="royal-header font-heading text-2xl font-bold tracking-tight">Smart Timetable</h1>
        <div className="flex items-center gap-4">
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 transition-all hover:bg-white/10"
            onClick={() => setDark((v) => !v)}
          >
            {dark ? "🌙" : "☀️"}
          </button>
          {user && (
            <div className="flex items-center gap-3">
              <span className="hidden rounded-lg bg-secondary/20 px-3 py-1 text-xs font-bold uppercase tracking-widest text-secondary md:block">
                {user.role}
              </span>
              <button
                className="rounded-xl bg-gradient-to-r from-accent to-red-900 px-5 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
