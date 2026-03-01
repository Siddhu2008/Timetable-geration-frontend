import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import client from "../api/client";
import TabularTimetable from "../components/TabularTimetable";
import { useUi } from "../context/UiContext";

export default function StudentPage() {
  const [entries, setEntries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("");
  const printRef = useRef(null);
  const { showLoader, hideLoader, toast } = useUi();

  useEffect(() => {
    (async () => {
      showLoader("Loading timetable...");
      try {
        const [e, t, s, r, c, ts] = await Promise.all([
          client.get("/timetable/student"),
          client.get("/teachers"),
          client.get("/subjects"),
          client.get("/rooms"),
          client.get("/classes"),
          client.get("/timeslots"),
        ]);
        setEntries(e.data);
        setTeachers(t.data);
        setSubjects(s.data);
        setRooms(r.data);
        setClasses(c.data);
        setSlots(ts.data);
      } catch {
        toast("Failed to load your timetable", "error");
      } finally {
        hideLoader();
      }
    })();
  }, []);

  const maps = useMemo(
    () => ({
      subjects: Object.fromEntries(subjects.map((x) => [x.id, x])),
      teachers: Object.fromEntries(teachers.map((x) => [x.id, x])),
      rooms: Object.fromEntries(rooms.map((x) => [x.id, x])),
    }),
    [subjects, teachers, rooms]
  );

  const filteredEntries = useMemo(
    () =>
      entries.filter(
        (e) =>
          (!subjectFilter || String(e.subject_id) === subjectFilter) &&
          (!teacherFilter || String(e.teacher_id) === teacherFilter)
      ),
    [entries, subjectFilter, teacherFilter]
  );

  const handlePrint = () => {
    window.print();
    toast("Print dialog opened", "info");
  };

  return (
    <div className="space-y-8 p-2 lg:p-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="royal-header font-heading text-4xl font-bold tracking-tight">My Timetable</h2>
          <p className="mt-1 text-sm text-slate-400">View your class timetable for the current schedule.</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-secondary/30 to-gold-dark/30 shadow-[0_10px_30px_#c5a02233]">
          <span className="text-2xl text-secondary">🗺️</span>
        </div>
      </motion.div>

      {/* Filters & Actions */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card flex flex-wrap items-end gap-5 p-6"
      >
        <div className="flex flex-1 min-w-[180px] flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filter by Subject</label>
          <select
            className="input !bg-black/20 !border-white/10"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 min-w-[180px] flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filter by Teacher</label>
          <select
            className="input !bg-black/20 !border-white/10"
            value={teacherFilter}
            onChange={(e) => setTeacherFilter(e.target.value)}
          >
            <option value="">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button
            className="btn-secondary !py-2.5 !px-5 text-xs"
            onClick={() => { setSubjectFilter(""); setTeacherFilter(""); }}
          >
            Clear Filters
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-2.5 text-xs font-bold text-blue-300 transition-all hover:bg-blue-500/20"
          >
            🖨️ Print Timetable
          </button>
        </div>
      </motion.div>

      {/* Timetable */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
        ref={printRef}
      >
        <div className="flex items-center gap-3">
          <div className="h-7 w-1 bg-secondary rounded-full" />
          <h3 className="font-heading text-xl font-bold">Timetable</h3>
          {(subjectFilter || teacherFilter) && (
            <span className="rounded-full bg-secondary/10 px-3 py-1 text-[10px] font-bold text-secondary">
              Filtered
            </span>
          )}
        </div>
        {entries.length === 0 ? (
          <div className="glass-card flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
            <span className="text-4xl">📋</span>
            <p className="text-sm font-bold">No timetable available yet.</p>
            <p className="text-xs">Your class timetable will appear here once an admin activates a schedule.</p>
          </div>
        ) : (
          <TabularTimetable
            entries={filteredEntries}
            slots={slots}
            subjects={maps.subjects}
            teachers={maps.teachers}
            rooms={maps.rooms}
            className="My Class Timetable"
          />
        )}
      </motion.section>
    </div>
  );
}
