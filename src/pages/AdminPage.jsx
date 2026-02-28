import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import client from "../api/client";
import Loader from "../components/Loader";
import TimetableGrid from "../components/TimetableGrid";
import TabularTimetable from "../components/TabularTimetable";
import ClassTimetableCard from "../components/ClassTimetableCard";
import { useUi } from "../context/UiContext";

const seedForms = {
  teacher: { name: "", max_lectures_per_day: 6 },
  room: { name: "", capacity: 40, room_type: "classroom" },
  class: { name: "", department: "", student_strength: 40 },
  subject: { name: "", class_id: "", lectures_per_week: 4, priority_morning: false, is_lab: false }
};

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [versions, setVersions] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [forms, setForms] = useState(seedForms);
  const [notice, setNotice] = useState("");
  const [conflictData, setConflictData] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [bulkTarget, setBulkTarget] = useState("teachers");
  const [bulkFile, setBulkFile] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState("all");
  const gridRef = useRef(null);
  const { toast, showLoader, hideLoader } = useUi();

  const loadAll = async () => {
    try {
      const [t, s, r, c, ts, v] = await Promise.all([
        client.get("/teachers"),
        client.get("/subjects"),
        client.get("/rooms"),
        client.get("/classes"),
        client.get("/timeslots"),
        client.get("/timetable/versions")
      ]);
      let slotData = ts.data || [];
      if (!slotData.length) {
        await client.post("/settings/time-config", {
          working_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          start_hour: 9,
          slots_per_day: 7,
          slot_duration_minutes: 50,
          break_duration_minutes: 20
        });
        const tsReload = await client.get("/timeslots");
        slotData = tsReload.data || [];
        toast("Default time slots created with break after 3+ hours", "info");
      }
      setTeachers(t.data);
      setSubjects(s.data);
      setRooms(r.data);
      setClasses(c.data);
      setSlots(slotData);
      setVersions(v.data);
      const active = v.data.find((x) => x.is_active);
      if (active) {
        setSelectedVersion(active.id);
        const p = await client.get(`/timetable/preview/${active.id}`);
        setEntries(p.data);
        const [conflicts, reports] = await Promise.all([client.get(`/timetable/conflicts/${active.id}`), client.get(`/timetable/reports/${active.id}`)]);
        setConflictData(conflicts.data);
        setReportData(reports.data);
      }
    } catch {
      toast("Failed to load admin data", "error");
    }
  };

  useEffect(() => {
    (async () => {
      showLoader("Loading dashboard...");
      await loadAll();
      hideLoader();
    })();
  }, []);

  const submit = async (key, endpoint) => {
    showLoader("Saving...");
    try {
      await client.post(endpoint, forms[key]);
      setForms((f) => ({ ...f, [key]: seedForms[key] }));
      await loadAll();
      toast("Saved successfully", "success");
    } catch (e) {
      toast(e.response?.data?.error || "Save failed", "error");
    } finally {
      hideLoader();
    }
  };

  const generate = async () => {
    setLoading(true);
    setNotice("");
    showLoader("Generating timetable...");
    try {
      const { data } = await client.post("/timetable/generate", { num_versions: 3 });
      setNotice(`Generated ${data.length} versions successfully`);
      toast(`Generated ${data.length} versions`, "success");
      await loadAll();
    } catch (e) {
      const base = e.response?.data?.error || "Generation failed";
      const issues = e.response?.data?.issues || [];
      const message = issues.length ? `${base} ${issues.join(" ")}` : base;
      setNotice(message);
      toast(base, "error");
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  const previewVersion = async (id) => {
    try {
      setSelectedVersion(id);
      const [p, conflicts, reports] = await Promise.all([
        client.get(`/timetable/preview/${id}`),
        client.get(`/timetable/conflicts/${id}`),
        client.get(`/timetable/reports/${id}`)
      ]);
      setEntries(p.data);
      setConflictData(conflicts.data);
      setReportData(reports.data);
      toast("Version preview loaded", "info");
    } catch {
      toast("Failed to load selected version", "error");
    }
  };

  const onDropEntry = async (entryId, slotId) => {
    try {
      await client.post(`/timetable/entry/${entryId}/move`, { time_slot_id: slotId });
      setNotice("Manual move saved");
      toast("Slot moved successfully", "success");
      if (selectedVersion) await previewVersion(selectedVersion);
    } catch (e) {
      const alternates = e.response?.data?.alternates || [];
      const msg = e.response?.data?.error || "Move failed";
      const suggestion = alternates.length ? ` Try slots: ${alternates.map((a) => `${a.day} ${a.start}-${a.end}`).join(", ")}` : "";
      setNotice(`${msg}.${suggestion}`);
      toast(msg, "error");
    }
  };

  const exportImage = async () => {
    if (!gridRef.current || !selectedVersion) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(gridRef.current, { backgroundColor: null, scale: 2 });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `timetable_${selectedVersion}.png`;
    a.click();
    toast("Image exported", "success");
  };

  const uploadBulk = async () => {
    if (!bulkFile) {
      setNotice("Select a file first for bulk upload.");
      toast("Select a file first", "warning");
      return;
    }
    const form = new FormData();
    form.append("target", bulkTarget);
    form.append("file", bulkFile);
    try {
      showLoader("Uploading bulk data...");
      const { data } = await client.post("/bulk/upload", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setNotice(`Bulk upload done: ${data.rows_imported}/${data.rows_read} records imported to ${data.target}.`);
      toast(`Bulk upload imported ${data.rows_imported} rows`, "success");
      setBulkFile(null);
      await loadAll();
    } catch (e) {
      setNotice(e.response?.data?.error || "Bulk upload failed.");
      toast(e.response?.data?.error || "Bulk upload failed", "error");
    } finally {
      hideLoader();
    }
  };

  const downloadTemplate = async () => {
    try {
      const res = await client.get(`/bulk/template/${bulkTarget}`, { responseType: "blob" });
      download(`${bulkTarget}_template.csv`)(res);
      toast("Template downloaded", "success");
    } catch {
      setNotice("Unable to download template.");
      toast("Unable to download template", "error");
    }
  };

  const maps = useMemo(
    () => ({
      subjects: Object.fromEntries(subjects.map((x) => [x.id, x])),
      teachers: Object.fromEntries(teachers.map((x) => [x.id, x])),
      rooms: Object.fromEntries(rooms.map((x) => [x.id, x]))
    }),
    [subjects, teachers, rooms]
  );

  return (
    <div className="space-y-12">
      {/* Royal Header & Primary Control */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card relative overflow-hidden p-8"
      >
        <div className="absolute right-0 top-0 h-64 w-64 translate-x-32 translate-y--32 rounded-full bg-secondary/10 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="royal-header font-heading text-4xl font-bold tracking-tight">Timetable Generator</h2>
            <p className="mt-1 font-medium italic" style={{ color: "var(--color-text-muted)" }}>Generate and manage the academic timetables.</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn relative overflow-hidden px-8 py-4 shadow-[0_20px_40px_#c5a0224d] group"
            onClick={generate}
          >
            <span className="relative z-10 flex items-center gap-3 font-black tracking-widest uppercase">
              <span className="text-xl">⚡</span> Ignite Generation
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-gold-dark opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        </div>

        {notice && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            className="mt-6 rounded-xl border border-secondary/20 bg-secondary/5 p-4 text-xs font-bold text-secondary tracking-wide uppercase"
          >
            📡 Transmission: {notice}
          </motion.div>
        )}
      </motion.div>


      {/* Version Selection Matrix */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card p-8"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="h-8 w-1 bg-secondary rounded-full" />
          <h3 className="font-heading text-2xl font-bold tracking-widest uppercase">Chronicle Versions</h3>
        </div>

        <div className="flex flex-wrap gap-4">
          {versions.map((v) => (
            <motion.button
              key={v.id}
              whileHover={{ y: -3 }}
              onClick={() => previewVersion(v.id)}
              className={`group relative flex flex-col items-start gap-1 rounded-2xl border px-6 py-4 transition-all duration-500 overflow-hidden ${selectedVersion === v.id ? "border-secondary/50 bg-secondary/10 shadow-[0_0_30px_rgba(197,160,34,0.15)]" : "border-white/5 bg-white/5 hover:bg-white/[0.08]"}`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest ${selectedVersion === v.id ? "text-secondary" : "text-slate-500"}`}>Sequence</span>
              <span className={`font-heading text-lg font-bold ${selectedVersion === v.id ? "text-white" : "text-slate-400"}`}>{v.name}</span>
              <span className="text-[10px] font-bold text-emerald-400/80">Affinity Score: {v.score}</span>
              {selectedVersion === v.id && <div className="absolute bottom-0 left-0 h-1 w-full bg-secondary" />}
            </motion.button>
          ))}
        </div>

        {!!selectedVersion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 flex flex-wrap gap-4 border-t border-white/5 pt-8"
          >
            <ExportButton label="PDF Document" icon="📄" onClick={() => client.get(`/timetable/export/pdf/${selectedVersion}`, { responseType: "blob" }).then(download("timetable.pdf")).then(() => toast("PDF exported", "success"))} />
            <ExportButton label="Excel Ledger" icon="📊" onClick={() => client.get(`/timetable/export/excel/${selectedVersion}`, { responseType: "blob" }).then(download("timetable.xlsx")).then(() => toast("Excel exported", "success"))} />
            <button className="btn relative group !px-8" onClick={async () => {
              await client.post(`/timetable/versions/${selectedVersion}/activate`);
              setNotice("Version primary timeline established");
              toast("Version activated", "success");
              await loadAll();
            }}>
              <span className="relative z-10">Establish Absolute Timeline</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Grid Editor Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1 bg-blue-500 rounded-full" />
            <h3 className="font-heading text-2xl font-bold tracking-widest uppercase text-white">Neural Distribution Matrix</h3>
          </div>
          <select className="input max-w-xs !bg-black/20 !border-white/10" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
            {classes.length > 0 ? (
              classes.map((c) => <option key={c.id} value={String(c.id)}>{c.name} Spectrum</option>)
            ) : (
              <option value="">No Formations Available</option>
            )}
          </select>
        </div>

        {selectedClassId && selectedClassId !== "all" && classes.length > 0 ? (
          <TabularTimetable
            entries={entries.filter(e => String(e.class_id) === selectedClassId)}
            slots={slots}
            subjects={maps.subjects}
            teachers={maps.teachers}
            rooms={maps.rooms}
            className={classes.find(c => String(c.id) === selectedClassId)?.name}
          />
        ) : (
          <div className="glass-card flex h-64 items-center justify-center border-white/5 bg-white/[0.02] rounded-3xl">
            <p className="font-heading text-xl text-slate-500 tracking-widest uppercase font-bold px-8 text-center">
              {classes.length > 0 ? "Select a formation from the dropdown to view its analytical matrix." : "Initiate the Generation Matrix to establish temporal synchrony."}
            </p>
          </div>
        )}
      </section>

      {/* Conflict & Intelligence Pane */}
      <div className="grid gap-10 lg:grid-cols-2">
        {conflictData && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card group border-red-500/10 bg-red-500/[0.02]"
          >
            <div className="border-b border-red-500/10 bg-red-500/5 px-8 py-6">
              <h3 className="font-heading text-xl font-bold text-red-400">Anomaly Detections ({(conflictData.detected || []).length})</h3>
            </div>
            <div className="p-8 space-y-3">
              {(conflictData.detected || []).slice(0, 6).map((c, idx) => (
                <div key={idx} className="flex items-start gap-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 transition-all hover:translate-x-1">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="text-[10px] font-black uppercase text-red-400 tracking-widest leading-none">{c.type}</p>
                    <p className="mt-1 text-sm font-bold text-red-100/90 leading-tight">{c.message}</p>
                  </div>
                </div>
              ))}
              {!(conflictData.detected || []).length && <p className="text-emerald-400 font-bold uppercase tracking-widest text-center text-sm py-4">Timeline Integrity Confirmed</p>}
            </div>
          </motion.div>
        )}

        {reportData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-card group border-blue-500/10 bg-blue-500/[0.02]"
          >
            <div className="border-b border-blue-500/10 bg-blue-500/5 px-8 py-6">
              <h3 className="font-heading text-xl font-bold text-blue-400">Chronometric Analytics</h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-center shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Efficiency Magnitude</p>
                  <p className="mt-2 text-4xl font-black text-secondary">{reportData.optimization_score ?? 0}%</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/5 p-6 text-center shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Stability Index</p>
                  <p className="mt-2 text-4xl font-black text-rose-500">-{reportData.conflict_count ?? 0}</p>
                </div>
              </div>

              <div className="space-y-6">
                <ModernBar title="Council Workload Distribution" data={reportData.teacher_workload} color="bg-secondary shadow-[0_0_10px_rgba(197,160,34,0.5)]" />
                <ModernBar title="Sanctuary Utilization" data={reportData.room_usage} color="bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function ConfigCard({ title, icon, children }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="glass-card flex flex-col p-8 group border-white/5 bg-white/[0.01]"
    >
      <div className="flex items-center gap-4 mb-8">
        <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform">{icon}</span>
        <h3 className="font-heading text-xl font-bold text-white tracking-wide">{title}</h3>
      </div>
      <div className="space-y-4 flex-1">{children}</div>
    </motion.div>
  );
}

function ExportButton({ label, icon, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white hover:border-white/20">
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ModernBar({ title, data = {}, color }) {
  const items = Object.entries(data || {}).slice(0, 5);
  const max = Math.max(1, ...items.map(([, v]) => Number(v)));
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none">{title}</h4>
      <div className="space-y-4">
        {items.map(([k, v]) => (
          <div key={k} className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold tracking-tight">
              <span className="text-slate-300">{k}</span>
              <span className="text-white">{v} units</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(Number(v) / max) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "circOut" }}
                className={`h-full rounded-full ${color}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function download(filename) {
  return (res) => {
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
}

function Card({ title, children }) {
  return (
    <div className="glass-card rounded-2xl p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function StatBlock({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <p className="text-xs uppercase text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-primary">{value}</p>
    </div>
  );
}

function SimpleBar({ title, data = {} }) {
  const items = Object.entries(data || {}).slice(0, 8);
  const max = Math.max(1, ...items.map(([, v]) => Number(v)));
  return (
    <div className="mt-4">
      <h4 className="mb-2 text-sm font-semibold">{title}</h4>
      <div className="space-y-2">
        {items.map(([k, v]) => (
          <div key={k}>
            <div className="mb-1 flex justify-between text-xs">
              <span>{k}</span>
              <span>{v}</span>
            </div>
            <div className="h-2 rounded bg-slate-200 dark:bg-slate-700">
              <div className="h-2 rounded bg-primary" style={{ width: `${(Number(v) / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }) {
  return (
    <label className="block text-sm">
      {label}
      <input className="input mt-1" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
