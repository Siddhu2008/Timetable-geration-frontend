const dayRank = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };

export default function ClassTimetableCard({ classItem, entries, slots, subjects, teachers, rooms }) {
  const classEntries = entries.filter((e) => e.class_id === classItem.id);
  const slotByDayOrder = {};
  const orders = new Set();
  const daysSet = new Set();

  slots.forEach((s) => {
    slotByDayOrder[`${s.day_of_week}-${s.slot_order}`] = s;
    orders.add(s.slot_order);
    daysSet.add(s.day_of_week);
  });

  const ordersList = [...orders].sort((a, b) => a - b);
  const days = [...daysSet].sort((a, b) => (dayRank[a] || 99) - (dayRank[b] || 99));

  const entryBySlot = {};
  classEntries.forEach((e) => {
    entryBySlot[e.time_slot_id] = e;
  });

  return (
    <div className="glass-card overflow-x-auto rounded-2xl p-4">
      <h3 className="mb-3 text-lg font-bold text-primary">{classItem.name}</h3>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left">
            <th className="p-2">Day</th>
            {ordersList.map((order) => {
              const sampleSlot = days.map((d) => slotByDayOrder[`${d}-${order}`]).find(Boolean);
              return (
                <th key={order} className="p-2">
                  <div>Period {order}</div>
                  <div className="text-xs opacity-80">{sampleSlot ? `${sampleSlot.start_time}-${sampleSlot.end_time}` : "-"}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day} className="border-t border-slate-200/40 dark:border-slate-700/40">
              <td className="p-2 font-semibold">{day}</td>
              {ordersList.map((order) => {
                const slot = slotByDayOrder[`${day}-${order}`];
                if (!slot) return <td key={order} className="p-2">-</td>;
                if (slot.is_break) {
                  return (
                    <td key={order} className="p-2">
                      <div className="rounded bg-amber-100 p-2 text-center text-xs font-bold uppercase text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">
                        Break
                      </div>
                    </td>
                  );
                }
                const entry = entryBySlot[slot.id];
                return (
                  <td key={order} className="p-2 align-top">
                    {entry ? (
                      <div className="rounded-xl bg-teal-100 p-2 text-xs text-teal-900 dark:bg-teal-900/30 dark:text-teal-100">
                        <div className="font-bold">{subjects[entry.subject_id]?.name || "Subject"}</div>
                        <div>{teachers[entry.teacher_id]?.name || "Teacher"}</div>
                        <div>{rooms[entry.room_id]?.name || "Room"}</div>
                      </div>
                    ) : (
                      <div className="rounded bg-slate-100 p-2 text-xs text-slate-500 dark:bg-slate-800">Free</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
