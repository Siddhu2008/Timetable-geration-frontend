import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import client from "../api/client";
import TimetableGrid from "../components/TimetableGrid";
import TabularTimetable from "../components/TabularTimetable";
import { useAuth } from "../context/AuthContext";
import { useUi } from "../context/UiContext";

export default function TeacherPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [slots, setSlots] = useState([]);
  const [availability, setAvailability] = useState({});
  const [notice, setNotice] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [fullEntries, setFullEntries] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const { toast, showLoader, hideLoader } = useUi();

  const load = async () => {
    try {
      const [e, t, s, r, c, ts, av, v] = await Promise.all([
        client.get("/timetable/teacher"),
        client.get("/teachers"),
        client.get("/subjects"),
        client.get("/rooms"),
        client.get("/classes"),
        client.get("/timeslots"),
        client.get(`/availability/${user.teacher_id}`),
        client.get("/timetable/versions")
      ]);
      setEntries(e.data);
      setTeachers(t.data);
      setSubjects(s.data);
      setRooms(r.data);
      setClasses(c.data);
      setSlots(ts.data);
      setAvailability(Object.fromEntries(av.data.map((x) => [x.time_slot_id, x.is_available])));
      const active = v.data.find(x => x.is_active);
      if (active) setActiveVersionId(active.id);
    } catch {
      toast("Failed to load teacher data", "error");
    }
  };

  useEffect(() => {
    if (!user?.teacher_id) return;
    (async () => {
      showLoader("Loading teacher dashboard...");
      await load();
      hideLoader();
    })();
  }, [user?.teacher_id]);

  const maps = useMemo(
    () => ({
      subjects: Object.fromEntries(subjects.map((x) => [x.id, x])),
      teachers: Object.fromEntries(teachers.map((x) => [x.id, x])),
      rooms: Object.fromEntries(rooms.map((x) => [x.id, x]))
    }),
    [subjects, teachers, rooms]
  );

  return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="royal-header font-heading text-4xl font-bold tracking-tight">Faculty Dashboard</h2>
          <p className="mt-1 text-sm text-slate-400">Greetings, {user?.username}. Your academic timeline awaits.</p>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-secondary/30 to-gold-dark/30 shadow-[0_10px_30px_#c5a02233]">
          <span className="text-3xl text-secondary">🏛️</span>
        </div>
      </motion.div>

      {notice && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-secondary/20 bg-secondary/5 p-4 text-xs font-bold text-secondary tracking-widest uppercase">
          📡 Chronicle Update: {notice}
        </motion.div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Availability Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card flex flex-col p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl">⏳</span>
            <h3 className="font-heading text-xl font-bold tracking-wide">Availability Matrix</h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {slots.map((slot) => (
              <label
                key={slot.id}
                className={`group flex items-center justify-between rounded-xl border p-4 transition-all duration-300 cursor-pointer ${availability[slot.id] ?? true ? "border-secondary/30 bg-secondary/10" : "border-white/5 bg-white/5 opacity-50 hover:bg-white/10"}`}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-tighter">{slot.day_of_week}</span>
                  <span className="text-sm font-bold text-white">{slot.start_time}</span>
                </div>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={availability[slot.id] ?? true}
                  onChange={async (e) => {
                    showLoader("Syncing with Oracle...");
                    try {
                      await client.post("/availability", { teacher_id: user.teacher_id, time_slot_id: slot.id, is_available: e.target.checked });
                      setAvailability((a) => ({ ...a, [slot.id]: e.target.checked }));
                      setNotice("Chronicle updated: Availability synchronized");
                      toast("Availability synchronized", "success");
                    } catch {
                      toast("Connection severed", "error");
                    } finally {
                      hideLoader();
                    }
                  }}
                />
                <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${(availability[slot.id] ?? true) ? "bg-secondary border-secondary shadow-[0_0_10px_#c5a02280]" : "border-white/20"}`}>
                  {(availability[slot.id] ?? true) && <span className="text-[10px] text-black">✓</span>}
                </div>
              </label>
            ))}
          </div>
        </motion.div>

        {/* Change Request Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card flex flex-col p-8"
        >
          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl">🛰️</span>
            <h3 className="font-heading text-xl font-bold tracking-wide">Temporal Requests</h3>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {entries.slice(0, 10).map((e) => (
              <div key={e.id} className="group relative flex items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/5 p-5 transition-all hover:bg-white/[0.08] hover:border-white/10">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 font-bold">
                    {maps.subjects[e.subject_id]?.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white tracking-tight">{maps.subjects[e.subject_id]?.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Formation: {classes.find(c => c.id === e.class_id)?.name}
                    </p>
                  </div>
                </div>
                <button
                  className="btn !px-4 !py-2 text-[10px] shadow-none opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={async () => {
                    const reason = window.prompt("State your objective for change:", "Temporal adjustment required");
                    if (!reason) return;
                    showLoader("Transmitting request...");
                    try {
                      await client.post("/timetable/teacher/request-change", { timetable_entry_id: e.id, reason });
                      setNotice("Request buffered: Administrator notified");
                      toast("Request transmitted", "success");
                    } catch {
                      toast("Transmission failed", "error");
                    } finally {
                      hideLoader();
                    }
                  }}
                >
                  Request Change
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-1 bg-secondary rounded-full" />
            <h3 className="font-heading text-2xl font-bold tracking-widest uppercase text-white">
              {selectedClassId ? "Class Spectrum" : "Academic Formation Grid"}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">View Scope:</span>
            <select
              className="input !py-1.5 !bg-black/20 !border-white/10 !w-48 text-xs focus:!border-secondary/50"
              value={selectedClassId}
              onChange={async (e) => {
                const id = e.target.value;
                setSelectedClassId(id);
                if (id && activeVersionId) {
                  showLoader("Retrieving Spectrum...");
                  try {
                    const { data } = await client.get(`/timetable/preview/${activeVersionId}`);
                    setFullEntries(data);
                    toast("Class spectrum retrieved", "info");
                  } catch {
                    toast("Failed to retrieve class spectrum", "error");
                  } finally { hideLoader(); }
                }
              }}
            >
              <option value="">Personal Timeline</option>
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!selectedClassId ? (
          <TimetableGrid entries={entries} slots={slots} subjects={maps.subjects} teachers={maps.teachers} rooms={maps.rooms} classes={classes} />
        ) : (
          <TabularTimetable
            entries={fullEntries.filter(e => String(e.class_id) === selectedClassId)}
            slots={slots}
            subjects={maps.subjects}
            teachers={maps.teachers}
            rooms={maps.rooms}
            className={classes.find(c => String(c.id) === selectedClassId)?.name}
          />
        )}
      </motion.section>
    </div>
  );
}
