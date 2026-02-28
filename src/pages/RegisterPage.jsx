import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";

export default function RegisterPage() {
  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [classId, setClassId] = useState("");
  const [name, setName] = useState("");
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { register } = useAuth();
  const { toast, showLoader, hideLoader } = useUi();
  const navigate = useNavigate();

  useEffect(() => {
    client.get("/auth/register-options").then((r) => {
      const fetchedClasses = r.data.classes || [];
      setClasses(fetchedClasses);
      if (fetchedClasses.length === 1) {
        setClassId(fetchedClasses[0].id);
      }
    }).catch(() => { });
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");
    showLoader("Forging Credentials...");
    try {
      const payload = { username, password, role };
      if (role === "student") payload.class_id = Number(classId);
      if (role === "teacher") payload.name = name || username;
      await register(payload);
      setOk("Master Account Forged Successfully.");
      toast("Registration successful", "success");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
      toast(err.response?.data?.error || "Registration failed", "error");
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050a14] px-4">
      {/* 3D-like background elements */}
      <div className="absolute right-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-secondary/10 blur-[120px]" />
      <div className="absolute left-[-10%] bottom-[-10%] h-[50%] w-[50%] rounded-full bg-primary/20 blur-[150px]" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-12 lg:flex-row">

        {/* Branding Side (Left Side) */}
        <div className="flex-1 text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="royal-header mb-4 font-heading text-5xl font-bold leading-tight lg:text-7xl">
              Architect <br /> The Future
            </h1>
            <p className="text-lg text-slate-400 lg:text-xl">
              Establish your presence in the central Academic Matrix. Synchronize schedules and coordinate globally.
            </p>

            {/* 3D-like Floating Element */}
            <motion.div
              className="mt-10 flex justify-center lg:justify-start"
              animate={{ y: [0, -20, 0], rotateY: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <div className="flex h-32 w-32 items-center justify-center rounded-3xl border border-white/20 bg-white/5 text-6xl shadow-2xl backdrop-blur-xl">
                🌌
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Register Form (Right Side) */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <form
            onSubmit={onSubmit}
            className="glass-card relative overflow-hidden p-8 lg:p-12 w-full"
          >
            {/* Decorative line */}
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50" />

            <h2 className="mb-2 font-heading text-3xl font-bold text-white">Join the Empire</h2>
            <p className="mb-8 text-sm text-slate-400">Establish your Academic Matrix</p>

            <div className="space-y-5">

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary">Designation</label>
                <select className="input w-full" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="student" className="bg-[#050a14]">Student Scholar</option>
                  <option value="teacher" className="bg-[#050a14]">Faculty Overseer</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary">Username</label>
                <input
                  className="input w-full"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Identify yourself"
                  required
                />
              </div>

              {role === "teacher" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-secondary">Full Title</label>
                  <input
                    className="input w-full"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Turing"
                  />
                </div>
              )}

              {role === "student" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-secondary">Cohort / Formation</label>
                  <select className="input w-full" value={classId} onChange={(e) => setClassId(e.target.value)} required>
                    {classes.length === 0 ? (
                      <option value="" className="bg-[#050a14]" disabled>No Matrices Available</option>
                    ) : (
                      classes.length > 1 && <option value="" className="bg-[#050a14]" disabled>Select Matrix</option>
                    )}
                    {classes.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#050a14]">
                        {c.name} Spectrum
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-secondary">Encryption Key</label>
                <div className="relative">
                  <input
                    className="input w-full pr-10"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-secondary"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "👁️" : "🙈"}
                  </button>
                </div>
              </div>

              {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">{error}</p>}
              {ok && <p className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400 border border-emerald-500/20">{ok}</p>}

              <button className="btn w-full mt-4">Forge Alliance</button>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm">
                <span className="text-slate-500">Already established?</span>
                <Link to="/login" className="font-bold text-secondary transition-colors hover:text-gold-light">
                  Authenticate Here
                </Link>
              </div>
            </div>
          </form>
        </motion.div>

      </div>
    </div>
  );
}
