import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import client from "../../api/client";
import Modal from "../../components/Modal";
import { useUi } from "../../context/UiContext";

const EMPTY = { name: "", capacity: 40, room_type: "classroom" };

const TYPE_BADGE = {
  classroom: { label: "Classroom", cls: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  lab: { label: "Lab", cls: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

export default function RoomsPage() {
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const bulkFileRef = useRef(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const { showLoader, hideLoader, toast } = useUi();

  const load = async () => { const r = await client.get("/rooms"); setRooms(r.data); };

  useEffect(() => {
    (async () => {
      showLoader("Loading rooms...");
      try { await load(); } catch { toast("Failed to load rooms", "error"); } finally { hideLoader(); }
    })();
  }, []);

  const openCreate = () => { setEditTarget(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (r) => { setEditTarget(r); setForm({ name: r.name, capacity: r.capacity, room_type: r.room_type }); setOpen(true); };

  const save = async () => {
    showLoader(editTarget ? "Updating room..." : "Adding room...");
    try {
      const payload = { ...form, capacity: Number(form.capacity) };
      if (editTarget) {
        await client.put(`/rooms/${editTarget.id}`, payload);
        toast("Room updated", "success");
      } else {
        await client.post("/rooms", payload);
        toast("Room added", "success");
      }
      setOpen(false); setForm(EMPTY); await load();
    } catch (e) { toast(e.response?.data?.error || "Failed to save room", "error"); }
    finally { hideLoader(); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    showLoader("Deleting room...");
    try {
      await client.delete(`/rooms/${deleteTarget.id}`);
      toast("Room deleted", "success"); setDeleteTarget(null); await load();
    } catch (e) { toast(e.response?.data?.error || "Failed to delete room", "error"); }
    finally { hideLoader(); }
  };

  const uploadBulk = async () => {
    const file = bulkFileRef.current?.files?.[0];
    if (!file) { toast("Select a file first", "warning"); return; }
    const fd = new FormData();
    fd.append("target", "rooms");
    fd.append("file", file);
    showLoader("Uploading rooms...");
    try {
      const { data } = await client.post("/bulk/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast(`Imported ${data.rows_imported} / ${data.rows_read} rows`, "success");
      setBulkOpen(false);
      if (bulkFileRef.current) bulkFileRef.current.value = "";
      await load();
    } catch (e) { toast(e.response?.data?.error || "Bulk upload failed", "error"); }
    finally { hideLoader(); }
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h2 className="royal-header font-heading text-4xl font-bold tracking-tight">Academic Halls</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>Manage classrooms and laboratories for scheduling.</p>
        </motion.div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2" onClick={() => setBulkOpen(true)}>📤 Bulk Upload</button>
          <button className="btn relative overflow-hidden group shadow-[0_10px_30px_rgba(197,160,34,0.2)]" onClick={openCreate}>
            <span className="relative z-10 flex items-center gap-2"><span className="text-xl">🏛️</span> Add Room</span>
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-gold-dark opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card relative p-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
        <div className="overflow-x-auto p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-[10px] font-black uppercase tracking-[0.2em]" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                <th className="pb-6">Room Name</th>
                <th className="pb-6 text-center">Capacity</th>
                <th className="pb-6">Type</th>
                <th className="pb-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((r, idx) => {
                const badge = TYPE_BADGE[r.room_type] || TYPE_BADGE.classroom;
                return (
                  <motion.tr key={r.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx }}
                    className="border-b transition-all" style={{ borderColor: "var(--color-border)" }}>
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🏫</span>
                        <span className="font-heading text-base font-bold" style={{ color: "var(--color-text)" }}>{r.name}</span>
                      </div>
                    </td>
                    <td className="py-5 text-center">
                      <span className="rounded-xl border px-4 py-2 font-black text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                        {r.capacity}
                      </span>
                    </td>
                    <td className="py-5">
                      <span className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase tracking-widest ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(r)} className="rounded-lg border px-3 py-1.5 text-xs font-bold transition-all hover:border-secondary/50 hover:text-secondary"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>✏️ Edit</button>
                        <button onClick={() => setDeleteTarget(r)} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20">🗑️ Delete</button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {!rooms.length && <p className="py-12 text-center text-sm font-bold uppercase tracking-widest" style={{ color: "var(--color-text-faint)" }}>No rooms yet.</p>}
        </div>
      </motion.div>

      <Modal open={open} onClose={() => setOpen(false)} title={editTarget ? "Edit Room" : "Add Room"}>
        <div className="space-y-5 p-2 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Room Name</label>
            <input className="input" placeholder="e.g., A-101" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Capacity</label>
            <input className="input" type="number" min="1" placeholder="e.g., 60" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Room Type</label>
            <select className="input" value={form.room_type} onChange={(e) => setForm({ ...form, room_type: e.target.value })}>
              <option value="classroom">Classroom</option>
              <option value="lab">Laboratory</option>
            </select>
          </div>
          <button className="btn w-full mt-4" onClick={save}>{editTarget ? "Save Changes" : "Add Room"}</button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Deletion">
        <div className="space-y-6 p-2 text-center">
          <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>Delete room <span className="text-secondary">"{deleteTarget?.name}"</span>? This cannot be undone.</p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors" onClick={confirmDelete}>Yes, Delete</button>
          </div>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Upload Rooms">
        <div className="space-y-5 p-2 text-left">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Upload <strong>CSV / Excel</strong> with columns:<br />
            <code className="text-secondary text-xs">name, capacity, room_type</code>
          </p>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Select File</label>
            <input ref={bulkFileRef} type="file" className="input cursor-pointer" />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1 text-sm" onClick={async () => {
              try {
                const res = await client.get("/bulk/template/rooms", { responseType: "blob" });
                const url = URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement("a"); a.href = url; a.download = "rooms_template.csv"; a.click();
                URL.revokeObjectURL(url);
              } catch { toast("Failed to download template", "error"); }
            }}>⬇️ Template</button>
            <button className="btn flex-1 text-sm" onClick={uploadBulk}>📤 Upload</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
