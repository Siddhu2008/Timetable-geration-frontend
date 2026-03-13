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

// Step indicator removed for simplicity

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TimetablePage() {
  // Data
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [entries, setEntries] = useState([]);
  // const [conflictData, setConflictData] = useState(null);
  // const [reportData, setReportData] = useState(null);

  // UI state
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [viewMode, setViewMode] = useState("table"); // "table" | "grid"
  const [generating, setGenerating] = useState(false);
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
        // client.get("/timetable/versions"),
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
      // setVersions(v.data);
      // const active = v.data.find((x) => x.is_active);
      // if (active) {
      //   setSelectedVersion(active.id);
      //   const p = await client.get(`/timetable/preview/${active.id}`);
      //   setEntries(p.data);
      //   setCurrentStep(4);
      // }
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

  // No version step needed

  // ── Maps ─────────────────────────────────────────────────────────────────────
  const maps = useMemo(
    () => ({
      subjects: Object.fromEntries(subjects.map((x) => [x.id, x])),
      teachers: Object.fromEntries(teachers.map((x) => [x.id, x])),
      rooms: Object.fromEntries(rooms.map((x) => [x.id, x])),
    }),
    [subjects, teachers, rooms]
  );

  // No readiness check

  const generate = async () => {
    setGenerating(true);
    showLoader("Generating timetable...");
    try {
      await client.post("/timetable/generate");
      toast(`Timetable generated`, "success");
      await loadAll();
    } catch (e) {
      toast("Generation failed", "error");
    } finally {
      setGenerating(false);
      hideLoader();
    }
  };

  // No version preview needed

  // No version activation needed

  const onDropEntry = async (entryId, slotId) => {
    try {
      await client.post(`/timetable/entry/${entryId}/move`, { time_slot_id: slotId });
      toast("Entry moved successfully", "success");
      // No version preview needed
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
    if (!gridRef.current) return;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(gridRef.current, { backgroundColor: null, scale: 2 });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `timetable.png`;
    a.click();
    toast("Image exported", "success");
  };

  // No active version
  // const conflictCount = (conflictData?.detected || []).length;

  return (
    <div className="space-y-8 p-2 lg:p-4">

      <h2 className="font-heading text-3xl font-bold mb-4">Timetable Generator</h2>
      <button
        className="btn px-8 py-4 mb-6"
        onClick={generate}
        disabled={generating}
      >
        {generating ? "Generating..." : "Generate Timetable"}
      </button>
      {entries.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4">
            <TabularTimetable
              entries={entries}
              slots={slots}
              subjects={maps.subjects}
              teachers={maps.teachers}
              rooms={maps.rooms}
              classes={classes}
            />
          </div>
        </div>
      )}
    </div>
  );
}
