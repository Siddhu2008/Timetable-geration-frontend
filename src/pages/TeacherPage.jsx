import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [selectedClassId, setSelectedClassId] = useState("");
  const [fullEntries, setFullEntries] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [showChangeModal, setShowChangeModal] = useState(null); // entry object or null
  const [changeReason, setChangeReason] = useState("");
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
        client.get("/timetable/versions"),
      ]);
      setEntries(e.data);
      setTeachers(t.data);
      setSubjects(s.data);
      setRooms(r.data);
      setClasses(c.data);
      setSlots(ts.data);
      setAvailability(Object.fromEntries(av.data.map((x) => [x.time_slot_id, x.is_available])));
      const active = v.data.find((x) => x.is_active);
      if (active) setActiveVersionId(active.id);
    } catch {
      toast("Failed to load schedule data", "error");
    }
  };

  useEffect(() => {
    if (!user?.teacher_id) return;
    (async () => {
      showLoader("Loading your schedule...");
      await load();
      hideLoader();
    })();
  }, [user?.teacher_id]);

  const maps = useMemo(
    () => ({
      subjects: Object.fromEntries(subjects.map((x) => [x.id, x])),
      teachers: Object.fromEntries(teachers.map((x) => [x.id, x])),
      rooms: Object.fromEntries(rooms.map((x) => [x.id, x])),
    }),
    [subjects, teachers, rooms]
  );

  // Get today's day name
  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
  const todaySlots = slots.filter((s) => s.day_of_week === todayName && !s.is_break);

  const markAbsentToday = async () => {
    if (!todaySlots.length) {
      toast("No teaching slots for today", "info");
      return;
    }
    showLoader("Marking absent for today...");
    try {
      await Promise.all(
        todaySlots.map((slot) =>
          client.post("/availability", {
            teacher_id: user.teacher_id,
            time_slot_id: slot.id,
            is_available: false,
          })
        )
      );
      setAvailability((prev) => {
        const next = { ...prev };
        todaySlots.forEach((s) => (next[s.id] = false));
        return next;
      });
      toast(`Marked absent for ${todaySlots.length} slot(s) today (${todayName})`, "success");
    } catch {
      toast("Failed to mark absent", "error");
    } finally {
      hideLoader();
    }
  };

  const submitChangeRequest = async () => {
    if (!showChangeModal || !changeReason.trim()) return;
    showLoader("Submitting request...");
    try {
      await client.post("/timetable/teacher/request-change", {
        timetable_entry_id: showChangeModal.id,
        reason: changeReason,
      });
      toast("Change request submitted. Admin has been notified.", "success");
      setShowChangeModal(null);
      setChangeReason("");
    } catch {
      toast("Failed to submit request", "error");
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="space-y-8 p-2 lg:p-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h2 className="royal-header font-heading text-4xl font-bold tracking-tight">My Schedule</h2>
          <p className="mt-1 text-sm text-slate-400">Welcome, {user?.username}. Manage your availability and view your timetable.</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-secondary/30 to-gold-dark/30 shadow-[0_10px_30px_#c5a02233]">
          <span className="text-2xl text-secondary">👨‍🏫</span>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Availability */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <h3 className="font-heading text-xl font-bold">My Availability</h3>
            </div>
            <button
              onClick={markAbsentToday}
              className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 transition-all hover:bg-rose-500/20"
            >
              🚫 Mark Absent Today ({todayName})
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 overflow-y-auto max-h-[360px] pr-1">
            {slots.map((slot) => {
              const isAvailable = availability[slot.id] ?? true;
              return (
                <label
                  key={slot.id}
                  className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all duration-200 ${isAvailable
                      ? "border-secondary/30 bg-secondary/10"
                      : "border-white/5 bg-white/5 opacity-60 hover:bg-white/10"
                    } ${slot.is_break ? "opacity-40 pointer-events-none" : ""}`}
                >
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wide">{slot.day_of_week}</span>
                    <div className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                      {slot.start_time} – {slot.end_time}
                    </div>
                    {slot.is_break && <span className="text-[10px] font-bold text-amber-500">Break</span>}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    disabled={slot.is_break}
                    checked={isAvailable}
                    onChange={async (e) => {
                      showLoader("Updating availability...");
                      try {
                        await client.post("/availability", {
                          teacher_id: user.teacher_id,
                          time_slot_id: slot.id,
                          is_available: e.target.checked,
                        });
                        setAvailability((a) => ({ ...a, [slot.id]: e.target.checked }));
                        toast("Availability updated", "success");
                      } catch {
                        toast("Update failed", "error");
                      } finally {
                        hideLoader();
                      }
                    }}
                  />
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${isAvailable ? "bg-secondary border-secondary shadow-[0_0_10px_#c5a02280]" : "border-white/20"
                      }`}
                  >
                    {isAvailable && <span className="text-[9px] text-black font-black">✓</span>}
                  </div>
                </label>
              );
            })}
          </div>
        </motion.div>

        {/* My Schedule Entries */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🗂️</span>
            <h3 className="font-heading text-xl font-bold">My Schedule Entries</h3>
          </div>
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {entries.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-slate-500">
                No schedule entries found. A timetable may not be active yet.
              </div>
            ) : (
              entries.slice(0, 12).map((e) => (
                <div
                  key={e.id}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/[0.08]"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 font-bold text-sm">
                      {maps.subjects[e.subject_id]?.name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                        {maps.subjects[e.subject_id]?.name || "Unknown Subject"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">
                        Class: {classes.find((c) => c.id === e.class_id)?.name || "—"}
                      </p>
                    </div>
                  </div>
                  <button
                    className="btn !px-3 !py-1.5 text-[10px] shadow-none opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => { setShowChangeModal(e); setChangeReason(""); }}
                  >
                    Request Change
                  </button>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Timetable view section */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-1 bg-secondary rounded-full" />
            <h3 className="font-heading text-xl font-bold">
              {selectedClassId ? "Class Timetable" : "My Personal Schedule"}
            </h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">View:</span>
            <select
              className="input !py-2 !bg-black/20 !border-white/10 !w-52 text-xs"
              value={selectedClassId}
              onChange={async (e) => {
                const id = e.target.value;
                setSelectedClassId(id);
                if (id && activeVersionId) {
                  showLoader("Loading timetable...");
                  try {
                    const { data } = await client.get(`/timetable/preview/${activeVersionId}`);
                    setFullEntries(data);
                  } catch {
                    toast("Failed to load class timetable", "error");
                  } finally {
                    hideLoader();
                  }
                }
              }}
            >
              <option value="">My Schedule</option>
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {!selectedClassId ? (
          <TimetableGrid
            entries={entries}
            slots={slots}
            subjects={maps.subjects}
            teachers={maps.teachers}
            rooms={maps.rooms}
            classes={classes}
          />
        ) : (
          <TabularTimetable
            entries={fullEntries.filter((e) => String(e.class_id) === selectedClassId)}
            slots={slots}
            subjects={maps.subjects}
            teachers={maps.teachers}
            rooms={maps.rooms}
            className={classes.find((c) => String(c.id) === selectedClassId)?.name}
          />
        )}
      </motion.section>

      {/* Change Request Modal */}
      <AnimatePresence>
        {showChangeModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowChangeModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-md p-8 space-y-6"
            >
              <div>
                <h3 className="font-heading text-2xl font-bold">Request Schedule Change</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Requesting change for: <strong>{maps.subjects[showChangeModal.subject_id]?.name}</strong>
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-400">Reason for change</label>
                <textarea
                  className="input resize-none h-28 text-sm"
                  placeholder="Explain why you need this schedule change..."
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button className="btn flex-1" onClick={submitChangeRequest} disabled={!changeReason.trim()}>
                  Submit Request
                </button>
                <button
                  onClick={() => setShowChangeModal(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
