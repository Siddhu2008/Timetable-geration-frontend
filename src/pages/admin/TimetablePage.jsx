import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import client from "../../api/client";
import TabularTimetable from "../../components/TabularTimetable";
import TimetableGrid from "../../components/TimetableGrid";
import { useUi } from "../../context/UiContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Step indicator ───────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, label: "Check Data" },
  { num: 2, label: "Generate" },
  { num: 3, label: "Pick Version" },
  { num: 4, label: "View & Edit" },
  { num: 5, label: "Conflicts" },
  { num: 6, label: "Download" },
];

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const done = current > s.num;
        const active = current === s.num;
        return (
          <div key={s.num} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all
              ${active ? "bg-secondary/20 text-secondary border border-secondary/40" :
                done ? "text-emerald-400" : "text-slate-500"}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black
                ${active ? "bg-secondary text-black" : done ? "bg-emerald-500 text-black" : "bg-white/10 text-slate-500"}`}>
                {done ? "✓" : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-1 h-px w-6 ${done ? "bg-emerald-500/50" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TimetablePage() {
  // Data
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [versions, setVersions] = useState([]);
  const [entries, setEntries] = useState([]);
  const [conflictData, setConflictData] = useState(null);
  const [reportData, setReportData] = useState(null);

  // UI state
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const [generating, setGenerating] = useState(false);
  const [numVersions, setNumVersions] = useState(3);
  const [notice, setNotice] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const gridRef = useRef(null);
  const { toast, showLoader, hideLoader } = useUi();

  // ── Load all data ────────────────────────────────────────────────────────────
  const loadAll = async () => {
    try {
      const [t, s, r, c, ts, v] = await Promise.all([
        client.get("/teachers"),
        client.get("/subjects"),
        client.get("/rooms"),
        client.get("/classes"),
        client.get("/timeslots"),
        client.get("/timetable/versions"),
      ]);

      let slotData = ts.data || [];
      if (!slotData.length) {
        await client.post("/settings/time-config", {
          working_days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
          start_hour: 9,
          slots_per_day: 7,
          slot_duration_minutes: 50,
          break_duration_minutes: 20,
        });
        const tsReload = await client.get("/timeslots");
        slotData = tsReload.data || [];
        toast("Default time slots created", "info");
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
        const [p, conflicts, reports] = await Promise.all([
          client.get(`/timetable/preview/${active.id}`),
          client.get(`/timetable/conflicts/${active.id}`),
          client.get(`/timetable/reports/${active.id}`),
        ]);
        setEntries(p.data);
        setConflictData(conflicts.data);
        setReportData(reports.data);
        setCurrentStep(4);
      }
    } catch {
      toast("Failed to load timetable data", "error");
    }
  };

  useEffect(() => {
    (async () => {
      showLoader("Loading timetable...");
      await loadAll();
      hideLoader();
    })();
  }, []);

  // Advance step when versions exist
  useEffect(() => {
    if (versions.length > 0 && currentStep < 3) setCurrentStep(3);
    if (versions.length > 0 && selectedVersion && currentStep < 4) setCurrentStep(4);
  }, [versions, selectedVersion]);

  // ── Maps ─────────────────────────────────────────────────────────────────────
  const maps = useMemo(
    () => ({
      subjects: Object.fromEntries(subjects.map((x) => [x.id, x])),
      teachers: Object.fromEntries(teachers.map((x) => [x.id, x])),
      rooms: Object.fromEntries(rooms.map((x) => [x.id, x])),
    }),
    [subjects, teachers, rooms]
  );

  // ── Readiness check ──────────────────────────────────────────────────────────
  const readinessItems = [
    { label: "Teachers", count: teachers.length, ok: teachers.length > 0 },
    { label: "Classes", count: classes.length, ok: classes.length > 0 },
    { label: "Subjects", count: subjects.length, ok: subjects.length > 0 },
    { label: "Rooms", count: rooms.length, ok: rooms.length > 0 },
    { label: "Time Slots", count: slots.length, ok: slots.length > 0 },
  ];
  const isReady = readinessItems.every((x) => x.ok);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const generate = async () => {
    setGenerating(true);
    setNotice("");
    showLoader("Generating timetable...");
    try {
      const { data } = await client.post("/timetable/generate", { num_versions: numVersions });
      setNotice(`Generated ${data.length} version${data.length > 1 ? "s" : ""} successfully.`);
      toast(`Generated ${data.length} versions`, "success");
      setCurrentStep(3);
      await loadAll();
    } catch (e) {
      const base = e.response?.data?.error || "Generation failed";
      const issues = e.response?.data?.issues || [];
      const message = issues.length ? `${base}\n• ${issues.join("\n• ")}` : base;
      setNotice(message);
      toast(base, "error");
    } finally {
      setGenerating(false);
      hideLoader();
    }
  };

  const previewVersion = async (id) => {
    showLoader("Loading version...");
    try {
      setSelectedVersion(id);
      const [p, conflicts, reports] = await Promise.all([
        client.get(`/timetable/preview/${id}`),
        client.get(`/timetable/conflicts/${id}`),
        client.get(`/timetable/reports/${id}`),
      ]);
      setEntries(p.data);
      setConflictData(conflicts.data);
      setReportData(reports.data);
      setCurrentStep(4);
      toast("Version loaded", "info");
    } catch {
      toast("Failed to load version", "error");
    } finally {
      hideLoader();
    }
  };

  const activateVersion = async () => {
    if (!selectedVersion) return;
    showLoader("Activating version...");
    try {
      await client.post(`/timetable/versions/${selectedVersion}/activate`);
      toast("Version set as active", "success");
      await loadAll();
    } catch {
      toast("Failed to activate version", "error");
    } finally {
      hideLoader();
    }
  };

  const onDropEntry = async (entryId, slotId) => {
    try {
      await client.post(`/timetable/entry/${entryId}/move`, { time_slot_id: slotId });
      toast("Entry moved successfully", "success");
      if (selectedVersion) await previewVersion(selectedVersion);
    } catch (e) {
      const alternates = e.response?.data?.alternates || [];
      const msg = e.response?.data?.error || "Move failed";
      const suggestion = alternates.length
        ? ` Suggested slots: ${alternates.map((a) => `${a.day} ${a.start}-${a.end}`).join(", ")}`
        : "";
      toast(`${msg}.${suggestion}`, "error");
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

  const activeVersion = versions.find((v) => v.is_active);
  const conflictCount = (conflictData?.detected || []).length;

  return (
    <div className="space-y-8 p-2 lg:p-4">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="royal-header font-heading text-4xl font-bold tracking-tight">
              Timetable Generator
            </h2>
            <p className="mt-1 text-slate-400 font-medium">
              Generate and manage conflict-free academic schedules.
            </p>
          </div>
          {activeVersion && (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-2.5 text-sm font-bold text-emerald-400">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Active: {activeVersion.name}
            </div>
          )}
        </div>

        {/* Step bar */}
        <div className="glass-card px-5 py-3">
          <StepBar current={currentStep} />
        </div>
      </motion.div>

      {/* ── Step 1: Data Readiness ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b px-6 py-4" style={{ borderColor: "var(--color-border)" }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-black text-xs font-black">1</span>
          <h3 className="font-heading text-lg font-bold">Data Readiness Check</h3>
          <div className={`ml-auto rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${isReady ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
            {isReady ? "✓ Ready to Generate" : "⚠ Setup Incomplete"}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-5">
          {readinessItems.map((item) => (
            <div key={item.label} className={`rounded-xl border p-4 text-center transition-all ${item.ok ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"}`}>
              <div className="text-2xl font-black" style={{ color: item.ok ? "#34d399" : "#f87171" }}>{item.count}</div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.label}</div>
              <div className="mt-1 text-sm">{item.ok ? "✅" : "❌"}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Step 2: Generate ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card overflow-hidden"
      >
        <div className="flex items-center gap-3 border-b px-6 py-4" style={{ borderColor: "var(--color-border)" }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-black text-xs font-black">2</span>
          <h3 className="font-heading text-lg font-bold">Generate Timetable</h3>
        </div>
        <div className="flex flex-wrap items-end gap-6 p-6">
          <div className="flex flex-col gap-2 min-w-[160px]">
            <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Number of Versions to Generate
            </label>
            <select
              className="input max-w-xs"
              value={numVersions}
              onChange={(e) => setNumVersions(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} version{n > 1 ? "s" : ""}</option>)}
            </select>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn flex items-center gap-3 px-8 py-4 shadow-[0_10px_30px_#c5a0224d] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={generate}
            disabled={generating || !isReady}
          >
            {generating ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating...
              </>
            ) : (
              <>⚡ Generate Timetable</>
            )}
          </motion.button>
          {!isReady && (
            <p className="text-sm font-medium text-rose-400">
              Please add missing data (teachers, classes, subjects, rooms) before generating.
            </p>
          )}
        </div>
        <AnimatePresence>
          {notice && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t px-6 py-4" style={{ borderColor: "var(--color-border)" }}
            >
              <p className={`text-sm font-medium whitespace-pre-line ${notice.includes("success") || notice.includes("Generated") ? "text-emerald-400" : "text-rose-400"}`}>
                {notice.includes("Generated") ? "✅ " : "⚠ "}{notice}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Step 3: Version Selection ────────────────────────────────────────── */}
      {versions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b px-6 py-4" style={{ borderColor: "var(--color-border)" }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-black text-xs font-black">3</span>
            <h3 className="font-heading text-lg font-bold">Select Version to Preview</h3>
          </div>
          <div className="flex flex-wrap gap-4 p-6">
            {versions.map((v) => {
              const isSelected = selectedVersion === v.id;
              return (
                <motion.button
                  key={v.id}
                  whileHover={{ y: -3 }}
                  onClick={() => previewVersion(v.id)}
                  className={`flex flex-col items-start gap-1.5 rounded-2xl border px-6 py-4 text-left transition-all duration-300 ${isSelected
                      ? "border-secondary/50 bg-secondary/10 shadow-[0_0_30px_rgba(197,160,34,0.15)]"
                      : "border-white/10 bg-white/5 hover:bg-white/[0.08]"
                    }`}
                >
                  <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-secondary" : "text-slate-500"}`}>
                    Version
                  </span>
                  <span className={`font-heading text-lg font-bold ${isSelected ? "text-white" : "text-slate-400"}`}>
                    {v.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-emerald-400">
                      Score: {v.score}
                    </span>
                    {v.is_active && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  {isSelected && <div className="absolute bottom-0 left-0 h-1 w-full rounded-b-2xl bg-secondary" />}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Step 4: View & Edit ──────────────────────────────────────────────── */}
      {selectedVersion && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex flex-wrap items-center gap-3 border-b px-6 py-4" style={{ borderColor: "var(--color-border)" }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-black text-xs font-black">4</span>
            <h3 className="font-heading text-lg font-bold">View &amp; Edit Timetable</h3>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              {/* View mode toggle */}
              <div className="flex rounded-xl border overflow-hidden" style={{ borderColor: "var(--color-border)" }}>
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all ${viewMode === "table" ? "bg-secondary/20 text-secondary" : "text-slate-400 hover:text-white"}`}
                >
                  Class View
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all ${viewMode === "grid" ? "bg-secondary/20 text-secondary" : "text-slate-400 hover:text-white"}`}
                >
                  Full Grid (Drag &amp; Drop)
                </button>
              </div>
              {/* Class selector (for table view) */}
              {viewMode === "table" && (
                <select
                  className="input max-w-[200px] !py-2 text-xs"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                >
                  {classes.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="p-4">
            {viewMode === "table" ? (
              selectedClassId && selectedClassId !== "all" ? (
                <TabularTimetable
                  entries={entries.filter((e) => String(e.class_id) === selectedClassId)}
                  slots={slots}
                  subjects={maps.subjects}
                  teachers={maps.teachers}
                  rooms={maps.rooms}
                  className={classes.find((c) => String(c.id) === selectedClassId)?.name}
                />
              ) : (
                <div className="flex h-48 items-center justify-center text-slate-500 text-sm font-bold">
                  Select a class from the dropdown above to view its timetable.
                </div>
              )
            ) : (
              <div ref={gridRef}>
                <TimetableGrid
                  entries={entries}
                  slots={slots}
                  subjects={maps.subjects}
                  teachers={maps.teachers}
                  rooms={maps.rooms}
                  classes={classes}
                  draggable={true}
                  onDropEntry={onDropEntry}
                />
              </div>
            )}
          </div>
          {viewMode === "grid" && (
            <div className="border-t px-6 py-3 text-[11px] text-slate-500 font-medium" style={{ borderColor: "var(--color-border)" }}>
              💡 Tip: Drag an entry card and drop it onto an empty slot to reschedule it. Locked entries (🔒) cannot be moved.
            </div>
          )}
        </motion.div>
      )}

      {/* ── Step 5: Conflicts ───────────────────────────────────────────────── */}
      {conflictData && selectedVersion && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b px-6 py-4" style={{ borderColor: "var(--color-border)" }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-black text-xs font-black">5</span>
            <h3 className="font-heading text-lg font-bold">Conflict Check</h3>
            <span className={`ml-auto rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${conflictCount === 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
              {conflictCount === 0 ? "✓ No Conflicts" : `${conflictCount} Conflict${conflictCount > 1 ? "s" : ""} Found`}
            </span>
          </div>
          <div className="p-6">
            {conflictCount === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-emerald-400">
                <span className="text-4xl">✅</span>
                <p className="text-sm font-bold">This timetable version has no scheduling conflicts. Safe to activate!</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {(conflictData.detected || []).map((c, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">{c.type}</p>
                      <p className="mt-0.5 text-sm font-medium text-rose-100/90">{c.message}</p>
                    </div>
                  </div>
                ))}
                {/* Suggested alternate slots */}
                {(conflictData.suggested_alternates || []).length > 0 && (
                  <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
                    <p className="text-[11px] font-black uppercase tracking-widest text-blue-400">💡 Suggested Alternate Slots</p>
                    {conflictData.suggested_alternates.slice(0, 4).map((sug) => (
                      <p key={sug.entry_id} className="text-xs font-medium text-blue-200">
                        Entry #{sug.entry_id} — try: {sug.alternates.map((a) => `${a.day} ${a.start}-${a.end}`).join(" or ")}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Optimization report mini-stats */}
            {reportData && (
              <div className="mt-6 grid grid-cols-2 gap-4 border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
                <div className="rounded-xl border p-4 text-center" style={{ borderColor: "var(--color-border)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Optimization Score</p>
                  <p className="mt-1 text-3xl font-black text-secondary">{reportData.optimization_score ?? 0}%</p>
                </div>
                <div className="rounded-xl border p-4 text-center" style={{ borderColor: "var(--color-border)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Conflicts</p>
                  <p className={`mt-1 text-3xl font-black ${(reportData.conflict_count ?? 0) === 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {reportData.conflict_count ?? 0}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Step 6: Download & Share ─────────────────────────────────────────── */}
      {selectedVersion && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card overflow-hidden"
        >
          <div className="flex items-center gap-3 border-b px-6 py-4" style={{ borderColor: "var(--color-border)" }}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-black text-xs font-black">6</span>
            <h3 className="font-heading text-lg font-bold">Download &amp; Activate</h3>
          </div>
          <div className="flex flex-wrap items-center gap-4 p-6">
            {/* Export buttons */}
            <button
              onClick={() =>
                client
                  .get(`/timetable/export/pdf/${selectedVersion}`, { responseType: "blob" })
                  .then(download("timetable.pdf"))
                  .then(() => toast("PDF downloaded", "success"))
              }
              className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-sm font-bold text-rose-300 transition-all hover:bg-rose-500/20"
            >
              📄 Download PDF
            </button>
            <button
              onClick={() =>
                client
                  .get(`/timetable/export/excel/${selectedVersion}`, { responseType: "blob" })
                  .then(download("timetable.xlsx"))
                  .then(() => toast("Excel downloaded", "success"))
              }
              className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500/20"
            >
              📊 Download Excel
            </button>
            <button
              onClick={exportImage}
              className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-sm font-bold text-blue-300 transition-all hover:bg-blue-500/20"
            >
              🖼️ Save as Image
            </button>

            <div className="h-10 w-px bg-white/10 hidden sm:block" />

            {/* Report exports */}
            <button
              onClick={() =>
                client
                  .get(`/timetable/reports/export/pdf/${selectedVersion}`, { responseType: "blob" })
                  .then(download(`report_${selectedVersion}.pdf`))
                  .then(() => toast("Report PDF downloaded", "success"))
              }
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-300 transition-all hover:bg-white/10"
            >
              📋 Report PDF
            </button>
            <button
              onClick={() =>
                client
                  .get(`/timetable/reports/export/excel/${selectedVersion}`, { responseType: "blob" })
                  .then(download(`report_${selectedVersion}.xlsx`))
                  .then(() => toast("Report Excel downloaded", "success"))
              }
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-300 transition-all hover:bg-white/10"
            >
              📋 Report Excel
            </button>

            <div className="ml-auto">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn flex items-center gap-2 px-6 py-3"
                onClick={activateVersion}
              >
                ✅ Set as Active Timetable
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
