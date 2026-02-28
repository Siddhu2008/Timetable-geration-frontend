import { motion } from "framer-motion";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function TabularTimetable({ entries, slots, subjects, teachers, rooms, className }) {
    // Group slots by time range and identify unique sorted time ranges
    const timeRanges = Array.from(new Set(slots.map(s => `${s.start_time} - ${s.end_time}`)))
        .sort((a, b) => {
            const timeA = a.split(" - ")[0];
            const timeB = b.split(" - ")[0];
            return timeA.localeCompare(timeB);
        });

    // Check which slot index is typically a break (usually around the middle)
    // Or explicitly check for is_break in slots
    const breakSlot = slots.find(s => s.is_break);
    const breakTimeRange = breakSlot ? `${breakSlot.start_time} - ${breakSlot.end_time}` : null;

    // Map entries for quick lookup: day -> timeRange -> entry
    const dataMap = {};
    entries.forEach(e => {
        const slot = slots.find(s => s.id === e.time_slot_id);
        if (slot) {
            if (!dataMap[slot.day_of_week]) dataMap[slot.day_of_week] = {};
            dataMap[slot.day_of_week][`${slot.start_time} - ${slot.end_time}`] = e;
        }
    });

    return (
        <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#050a14] p-1 shadow-2xl">
            {/* Royal Header */}
            <div className="bg-[#1a237e] p-6 text-center shadow-lg">
                <h2 className="font-heading text-4xl font-bold tracking-widest text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                    Time Table
                </h2>
            </div>

            {/* Class Section Header */}
            <div className="border-y border-white/5 bg-[#C5A022] px-8 py-3 flex justify-between items-center shadow-inner">
                <h3 className="font-heading text-2xl font-black text-[#050a14] uppercase tracking-tighter">
                    {className || "Academic Formation"}
                </h3>
                <div className="h-1 w-24 bg-[#050a14]/20 rounded-full" />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse border-spacing-0 overflow-hidden">
                    <thead>
                        <tr>
                            <th className="border-r border-b border-white/10 bg-white/5 p-6 font-heading text-2xl font-black text-secondary uppercase tracking-widest">
                                Days
                            </th>
                            {timeRanges.map((time, idx) => (
                                <th key={time} className={`border-b border-white/10 ${time === breakTimeRange ? "bg-amber-500/10" : "bg-white/5"} p-4 min-w-[150px]`}>
                                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Period {idx + 1}</div>
                                    <div className="font-heading text-sm font-bold text-white whitespace-nowrap">{time}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {days.map((day) => (
                            <tr key={day} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="border-r border-b border-white/10 bg-white/[0.03] p-6 font-black text-slate-100 uppercase tracking-widest text-sm">
                                    {day}
                                </td>
                                {timeRanges.map((time) => {
                                    const entry = dataMap[day]?.[time];

                                    if (time === breakTimeRange) {
                                        return day === "Monday" ? (
                                            <td key={`${day}-${time}`} rowSpan={days.length} className="border-b border-white/10 bg-gradient-to-b from-amber-500/15 via-amber-500/5 to-amber-500/15 p-4 text-center">
                                                <div className="flex flex-col items-center justify-center gap-8 py-16 relative overflow-hidden group/lunch">
                                                    {/* Kinetic Background */}
                                                    <motion.div
                                                        animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 4 }}
                                                        className="absolute inset-0 bg-amber-500/5 blur-3xl rounded-full"
                                                    />

                                                    <motion.span
                                                        animate={{
                                                            y: [0, -15, 0],
                                                            rotate: [0, 5, -5, 0],
                                                            filter: ["drop-shadow(0 0 10px #f59e0b40)", "drop-shadow(0 0 25px #f59e0b80)", "drop-shadow(0 0 10px #f59e0b40)"]
                                                        }}
                                                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                                        className="text-6xl select-none"
                                                    >
                                                        🍽️
                                                    </motion.span>

                                                    <div className="[writing-mode:vertical-lr] font-black text-4xl text-amber-500 uppercase tracking-[0.8em] rotate-180 drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)] group-hover/lunch:tracking-[1em] transition-all duration-700">
                                                        LUNCH
                                                    </div>
                                                </div>
                                            </td>
                                        ) : null;
                                    }

                                    return (
                                        <td key={`${day}-${time}`} className="border-b border-l border-white/10 p-3">
                                            {entry ? (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    whileHover={{
                                                        y: -8,
                                                        scale: 1.05,
                                                        boxShadow: "0 20px 40px -10px #c5a0224d"
                                                    }}
                                                    className="h-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.02] to-transparent p-5 flex flex-col justify-center text-center shadow-xl backdrop-blur-sm transition-all duration-500 hover:border-secondary/50 group/cell"
                                                >
                                                    <div className="text-[9px] font-black text-secondary uppercase tracking-[0.3em] mb-2 leading-none opacity-80 group-hover/cell:opacity-100 transition-opacity">
                                                        {subjects[entry.subject_id]?.name?.split(' ')[0] || "SUBJECT"}
                                                    </div>
                                                    <div className="font-heading text-lg font-bold text-white mb-4 leading-tight tracking-tight drop-shadow-sm group-hover/cell:text-secondary-light transition-colors">
                                                        {subjects[entry.subject_id]?.name || "Unknown Subject"}
                                                    </div>
                                                    <div className="grid gap-2.5 text-[10px] font-bold uppercase text-slate-400">
                                                        <div className="flex items-center justify-center gap-2 rounded-xl bg-black/40 border border-white/5 py-2 px-3 shadow-inner group-hover/cell:border-secondary/20 transition-colors">
                                                            <span className="text-secondary opacity-80">👤</span> <span className="truncate max-w-[100px]">{teachers[entry.teacher_id]?.name || "Unassigned"}</span>
                                                        </div>
                                                        <div className="flex items-center justify-center gap-2 rounded-xl bg-black/40 border border-white/5 py-2 px-3 shadow-inner group-hover/cell:border-secondary/20 transition-colors">
                                                            <span className="text-secondary opacity-80">🏛️</span> <span className="truncate max-w-[100px]">{rooms[entry.room_id]?.name || "TBA"}</span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <div className="flex h-28 items-center justify-center opacity-5">
                                                    <div className="h-3 w-3 rounded-full bg-white animate-pulse" />
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

            {/* Royal Footer Accent */}
            <div className="h-2 w-full bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
        </div>
    );
}
