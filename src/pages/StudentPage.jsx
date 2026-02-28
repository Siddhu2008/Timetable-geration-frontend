import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import client from "../api/client";
import TimetableGrid from "../components/TimetableGrid";
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
          client.get("/timeslots")
        ]);
        setEntries(e.data);
        setTeachers(t.data);
        setSubjects(s.data);
        setRooms(r.data);
        setClasses(c.data);
        setSlots(ts.data);
      } catch {
        toast("Failed to load student timetable", "error");
      } finally {
        hideLoader();
      }
    })();
  }, []);

  const maps = useMemo(
    () => ({
      subjects: Object.fromEntries(subjects.map((x) => [x.id, x])),
      teachers: Object.fromEntries(teachers.map((x) => [x.id, x])),
      rooms: Object.fromEntries(rooms.map((x) => [x.id, x]))
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

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="royal-header font-heading text-4xl font-bold tracking-tight">Academic Grid</h2>
          <p className="mt-1 text-sm text-slate-400">Navigate the grand design of your educational journey.</p>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-secondary/30 to-gold-dark/30 shadow-[0_10px_30px_#c5a02233]">
          <span className="text-3xl text-secondary">🗺️</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card flex flex-wrap items-center gap-6 p-8"
      >
        <div className="flex flex-1 min-w-[200px] flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Curriculum Filter</label>
          <select className="input !bg-black/20 !border-white/10 focus:!border-secondary/50" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
            <option value="">All Disciplines</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 min-w-[200px] flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Faculty Filter</label>
          <select className="input !bg-black/20 !border-white/10 focus:!border-secondary/50" value={teacherFilter} onChange={(e) => setTeacherFilter(e.target.value)}>
            <option value="">All Mentors</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end h-full pt-4">
          <button className="btn !py-2.5 !px-6 text-[10px] shadow-none" onClick={() => { setSubjectFilter(""); setTeacherFilter(""); }}>Clear Matrix</button>
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-4">
          <div className="h-8 w-1 bg-secondary rounded-full" />
          <h3 className="font-heading text-2xl font-bold tracking-widest uppercase text-white">Temporal Formation Grid</h3>
        </div>
        <TabularTimetable
          entries={filteredEntries}
          slots={slots}
          subjects={maps.subjects}
          teachers={maps.teachers}
          rooms={maps.rooms}
          className="Your Assigned Curriculum"
        />
      </motion.section>
    </div>
  );
}
