import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import client from "../../api/client";
import { useUi } from "../../context/UiContext";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [versions, setVersions] = useState([]);
  const { showLoader, hideLoader, toast } = useUi();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      showLoader("Loading dashboard...");
      try {
        const [t, c, s, r, v] = await Promise.all([
          client.get("/teachers"),
          client.get("/classes"),
          client.get("/subjects"),
          client.get("/rooms"),
          client.get("/timetable/versions"),
        ]);
        setTeachers(t.data);
        setClasses(c.data);
        setSubjects(s.data);
        setRooms(r.data);
        setVersions(v.data);
      } catch {
        toast("Failed to load dashboard data", "error");
      } finally {
        hideLoader();
      }
    })();
  }, []);

  const byClass = useMemo(() => {
    const out = {};
    classes.forEach((c) => {
      out[c.id] = { className: c.name, count: 0 };
    });
    subjects.forEach((s) => {
      if (out[s.class_id]) out[s.class_id].count += 1;
    });
    return Object.values(out);
  }, [classes, subjects]);

  const activeVersion = versions.find((v) => v.is_active);

  return (
    <div className="space-y-10 p-2 lg:p-4">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }}>
          <h2 className="royal-header font-heading text-5xl font-bold tracking-tight">Dashboard</h2>
          <p className="mt-1 text-slate-400 font-medium">Overview of your institution's scheduling data.</p>
        </motion.div>

        <motion.div className="flex gap-3" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          {activeVersion ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-3 text-sm font-bold text-emerald-400 backdrop-blur-2xl shadow-[0_0_20px_rgba(52,211,153,0.1)]">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Active: {activeVersion.name}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-3 text-sm font-bold text-amber-400">
              ⚠ No active timetable
            </div>
          )}
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card title="Teachers" value={teachers.length} icon="👨‍🏫" color="from-blue-600 to-indigo-700" delay={0.1} />
        <Card title="Classes" value={classes.length} icon="🏫" color="from-amber-500 to-orange-600" delay={0.2} />
        <Card title="Subjects" value={subjects.length} icon="📚" color="from-emerald-500 to-teal-600" delay={0.3} />
        <Card title="Rooms" value={rooms.length} icon="🏛️" color="from-rose-500 to-pink-600" delay={0.4} />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Subjects per class table */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="glass-card group overflow-hidden"
        >
          <div className="relative border-b px-8 py-6" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-hover)" }}>
            <div className="absolute left-0 top-0 h-full w-1 bg-secondary shadow-[4px_0_15px_rgba(197,160,34,0.3)]" />
            <h3 className="font-heading text-xl font-bold tracking-wide" style={{ color: "var(--color-text)" }}>
              Subjects per Class
            </h3>
          </div>
          <div className="p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <th className="pb-6">Class Name</th>
                    <th className="pb-6 text-center">Subjects</th>
                    <th className="pb-6">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {byClass.map((row) => (
                    <tr key={row.className} style={{ borderColor: "var(--color-border)" }}>
                      <td className="py-4 font-bold" style={{ color: "var(--color-text)" }}>{row.className}</td>
                      <td className="py-4 text-center">
                        <span className="inline-block rounded-xl border border-secondary/20 bg-secondary/10 px-4 py-1.5 text-xs font-black text-secondary">
                          {row.count}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="relative h-2 w-32 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(row.count * 15, 100)}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-secondary to-gold-dark shadow-[0_0_12px_rgba(197,160,34,0.6)]"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                  {byClass.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-sm text-slate-500">
                        No class data yet. Add classes and subjects to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Timetable Engine card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="glass-card relative flex flex-col items-center justify-center overflow-hidden p-12 text-center cursor-pointer hover:border-secondary/30 transition-colors"
          onClick={() => navigate("/admin/timetable")}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(197,160,34,0.05)_0%,_transparent_70%)]" />

          <motion.div
            animate={{ y: [0, -16, 0], scale: [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="mb-8 flex h-40 w-40 items-center justify-center rounded-full border-2 border-secondary/30 bg-gradient-to-br from-secondary/20 via-transparent to-primary/20 shadow-[0_0_60px_rgba(197,160,34,0.15)] backdrop-blur-3xl"
          >
            <div className="text-6xl drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">📅</div>
          </motion.div>

          <h3 className="relative font-heading text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            Timetable Generator
          </h3>
          <p className="mt-3 max-w-xs font-medium leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            Click here to generate, preview, edit and download your institution's timetable.
          </p>
          <div className="mt-6 flex items-center gap-2 text-secondary font-bold text-sm">
            Go to Timetable →
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Card({ title, value, icon, color, delay }) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="glass-card group relative p-8 shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
    >
      <div className={`absolute -right-6 -top-6 h-28 w-28 rounded-full bg-gradient-to-br ${color} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-40`} />
      <div className="relative flex items-start justify-between">
        <div>
          <h4 className="font-heading text-lg font-bold transition-colors" style={{ color: "var(--color-text)" }}>{title}</h4>
        </div>
        <motion.span
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-4xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]"
        >
          {icon}
        </motion.span>
      </div>
      <div className="mt-6 flex items-baseline gap-3">
        <span className="text-5xl font-black tracking-tighter" style={{ color: "var(--color-text)" }}>{value}</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Total</span>
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-secondary to-gold-dark transition-all duration-700 group-hover:w-full" />
    </motion.div>
  );
}
