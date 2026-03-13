import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";
import client from "../api/client";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const { login } = useAuth();
  const { toast, showLoader, hideLoader } = useUi();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    showLoader("Signing in...");
    try {
      await login(username, password);
      toast("Login successful", "success");
      navigate("/");
    } catch {
      setError("Invalid username/password");
      toast("Invalid username/password", "error");
    } finally {
      hideLoader();
    }
  };

  const resetAdminCredentials = async () => {
    setError("");
    setInfo("");
    try {
      await client.post("/auth/seed-admin");
      setUsername("admin");
      setPassword("admin");
      setInfo("Admin credentials reset: admin / admin");
      toast("Admin credentials reset", "success");
    } catch {
      setError("Could not reset admin credentials. Make sure backend is running.");
      toast("Could not reset admin credentials", "error");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050a14] px-4">
      {/* 3D-like background elements */}
      <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-secondary/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-primary/20 blur-[150px]" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-12 lg:flex-row">
        {/* Branding Side */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="royal-header mb-4 font-heading text-5xl font-bold leading-tight lg:text-7xl">
              Excellence in <br /> Coordination
            </h1>
            <p className="text-lg text-slate-400 lg:text-xl">
              Enter the future of academic management with our royal-grade Smart Timetable Generator.
            </p>

            {/* 3D-like Floating Element (Book/Clock) */}
            <motion.div
              className="mt-10 flex justify-center lg:justify-start"
              animate={{ y: [0, -20, 0], rotateY: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <div className="flex h-32 w-32 items-center justify-center rounded-3xl border border-white/20 bg-white/5 text-6xl shadow-2xl backdrop-blur-xl">
                <span role="img" aria-label="Books">📚</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <form
            onSubmit={handleSubmit}
            className="glass-card relative overflow-hidden p-8 lg:p-12"
          >
            {/* Decorative line */}
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50" />

            <h2 className="mb-2 font-heading text-3xl font-bold text-white">Welcome Back</h2>
            <p className="mb-8 text-sm text-slate-400">Authenticating Excellence</p>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary">Username</label>
                <input
                  className="input"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary">Password</label>
                <div className="relative">
                  <input
                    className="input w-full"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-secondary"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <span role="img" aria-label="Hide password">👁️</span> : <span role="img" aria-label="Show password">🙈</span>}
                  </button>
                </div>
              </div>

              {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">{error}</p>}
              {info && <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400 border border-emerald-500/20">{info}</p>}

              <button type="submit" className="btn w-full">Sign In to Dashboard</button>

              <button
                type="button"
                className="btn-secondary w-full text-xs"
                onClick={resetAdminCredentials}
              >
                Reset Admin Credentials
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                <span className="text-slate-500">New user?</span>
                <Link to="/register" className="font-bold text-secondary transition-colors hover:text-gold-light">
                  Create Master Account
                </Link>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
