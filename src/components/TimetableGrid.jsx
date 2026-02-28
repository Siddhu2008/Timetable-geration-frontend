import { motion } from "framer-motion";

const entryColors = [
  "border-blue-500/30 bg-blue-500/10 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.1)]",
  "border-amber-500/30 bg-amber-500/10 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]",
  "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
  "border-purple-500/30 bg-purple-500/10 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)]",
];

export default function TimetableGrid({ entries, slots, subjects, teachers, rooms, classes, draggable = false, onDropEntry, gridRef }) {
  const dayRank = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
  const sortedSlots = [...slots].sort((a, b) => {
    const da = dayRank[a.day_of_week] || 99;
    const db = dayRank[b.day_of_week] || 99;
    if (da === db) return a.slot_order - b.slot_order;
    return da - db;
  });

  const bySlot = {};
  entries.forEach((e) => {
    bySlot[`${e.class_id}-${e.time_slot_id}`] = e;
  });

  return (
    <div ref={gridRef} className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/5 backdrop-blur-md">
              <th className="sticky left-0 z-20 bg-[#0d1b2a] p-4 font-heading text-lg font-bold text-secondary shadow-[2px_0_10px_rgba(0,0,0,0.3)]">
                Formation
              </th>
              {sortedSlots.map((s) => (
                <th key={s.id} className={`p-4 min-w-[140px] border-l border-white/5 ${s.is_break ? "bg-amber-500/10" : ""}`}>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500">{s.day_of_week}</div>
                  <div className="mt-1 font-heading text-secondary">{`${s.start_time} - ${s.end_time}`}</div>
                  {s.is_break && <div className="mt-1 text-[10px] font-black text-amber-500 uppercase tracking-tighter">Interlude</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {classes.map((cls, rowIdx) => (
              <tr key={cls.id} className="group hover:bg-white/5 transition-colors">
                <td className="sticky left-0 z-20 bg-[#0d1b2a]/90 p-4 font-bold text-white shadow-[2px_0_10px_rgba(0,0,0,0.3)] backdrop-blur-md group-hover:bg-[#1a237e]/40 transition-colors">
                  {cls.name}
                </td>
                {sortedSlots.map((slot, colIdx) => {
                  const entry = bySlot[`${cls.id}-${slot.id}`];
                  return (
                    <td
                      key={slot.id}
                      className={`p-2 border-l border-white/5 transition-all ${slot.is_break ? "bg-amber-500/5" : ""}`}
                      onDragOver={(e) => draggable && !slot.is_break && e.preventDefault()}
                      onDrop={(e) => {
                        if (!draggable || slot.is_break) return;
                        const entryId = Number(e.dataTransfer.getData("entry_id"));
                        if (entryId) onDropEntry?.(entryId, slot.id);
                      }}
                    >
                      {slot.is_break ? (
                        <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-amber-500/20 text-[10px] font-bold uppercase text-amber-500/40">
                          Respite
                        </div>
                      ) : entry ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: (rowIdx + colIdx) * 0.005 }}
                          className={`relative h-20 rounded-xl border p-3 flex flex-col justify-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${entryColors[(entry.subject_id + entry.teacher_id) % entryColors.length]} ${entry.is_locked ? "opacity-60 grayscale-[0.5]" : "cursor-grab active:cursor-grabbing"}`}
                          draggable={draggable && !entry.is_locked}
                          onDragStart={(e) => {
                            if (!draggable || entry.is_locked) return;
                            e.dataTransfer.setData("entry_id", String(entry.id));
                          }}
                        >
                          <div className="truncate font-heading text-sm font-bold leading-tight">{subjects[entry.subject_id]?.name || "Unassigned"}</div>
                          <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-white/60">
                            <span>🏛️ {rooms[entry.room_id]?.name || "TBA"}</span>
                            <span>•</span>
                            <span className="truncate">👨‍🏫 {teachers[entry.teacher_id]?.name || "TBA"}</span>
                          </div>
                          {entry.is_locked && <span className="absolute right-2 top-2 text-[10px]">🔒</span>}
                        </motion.div>
                      ) : (
                        <div className="h-20 rounded-xl border border-dashed border-white/5 bg-white/[0.02] flex items-center justify-center transition-colors hover:bg-white/[0.05]">
                          <span className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Available</span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
