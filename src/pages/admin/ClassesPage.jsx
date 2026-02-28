import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import client from "../../api/client";
import Modal from "../../components/Modal";
import { useUi } from "../../context/UiContext";

const EMPTY = { name: "", department: "", student_strength: 40 };

export default function ClassesPage() {
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const bulkFileRef = useRef(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const { showLoader, hideLoader, toast } = useUi();

  const load = async () => {
    const [c, s] = await Promise.all([client.get("/classes"), client.get("/subjects")]);
    setClasses(c.data);
    setSubjects(s.data);
  };

  useEffect(() => {
    (async () => {
      showLoader("Loading classes...");
      try { await load(); } catch { toast("Failed to load classes", "error"); } finally { hideLoader(); }
    })();
  }, []);

  const subjectCountByClass = useMemo(() => {
    const out = {};
    subjects.forEach((s) => { out[s.class_id] = (out[s.class_id] || 0) + 1; });
    return out;
  }, [subjects]);

  const openCreate = () => { setEditTarget(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (c) => { setEditTarget(c); setForm({ name: c.name, department: c.department, student_strength: c.student_strength }); setOpen(true); };

  const save = async () => {
    showLoader(editTarget ? "Updating class..." : "Adding class...");
    try {
      if (editTarget) {
        await client.put(`/classes/${editTarget.id}`, { ...form, student_strength: Number(form.student_strength) });
        toast("Class updated", "success");
      } else {
        await client.post("/classes", { ...form, student_strength: Number(form.student_strength) });
        toast("Class added", "success");
      }
      setOpen(false); setForm(EMPTY); await load();
    } catch (e) { toast(e.response?.data?.error || "Failed to save class", "error"); }
    finally { hideLoader(); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    showLoader("Deleting class...");
    try {
      await client.delete(`/classes/${deleteTarget.id}`);
      toast("Class deleted", "success"); setDeleteTarget(null); await load();
    } catch (e) { toast(e.response?.data?.error || "Failed to delete class", "error"); }
    finally { hideLoader(); }
  };

  const uploadBulk = async () => {
    const file = bulkFileRef.current?.files?.[0];
    if (!file) { toast("Select a file first", "warning"); return; }
    const fd = new FormData();
    fd.append("target", "classes");
    fd.append("file", file);
    showLoader("Uploading classes...");
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
          <h2 className="royal-header font-heading text-4xl font-bold tracking-tight">Academic Formations</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>Strategize your class structures and student strength.</p>
        </motion.div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2" onClick={() => setBulkOpen(true)}>📤 Bulk Upload</button>
          <button className="btn relative overflow-hidden group shadow-[0_10px_30px_rgba(197,160,34,0.2)]" onClick={openCreate}>
            <span className="relative z-10 flex items-center gap-2"><span>➕</span> Add Class</span>
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
                <th className="pb-6">Class Name</th>
                <th className="pb-6">Department</th>
                <th className="pb-6 text-center">Students</th>
                <th className="pb-6 text-center">Subjects</th>
                <th className="pb-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c, idx) => (
                <motion.tr key={c.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx }}
                  className="border-b transition-all" style={{ borderColor: "var(--color-border)" }}>
                  <td className="py-5 font-heading text-base font-bold italic" style={{ color: "var(--color-text)" }}>{c.name}</td>
                  <td className="py-5">
                    <span className="rounded-lg border px-3 py-1.5 text-xs font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                      🏛️ {c.department}
                    </span>
                  </td>
                  <td className="py-5 text-center font-heading text-base font-bold" style={{ color: "var(--color-text)" }}>{c.student_strength}</td>
                  <td className="py-5 text-center text-xl font-black text-secondary">{subjectCountByClass[c.id] || 0}</td>
                  <td className="py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="rounded-lg border px-3 py-1.5 text-xs font-bold transition-all hover:border-secondary/50 hover:text-secondary"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>✏️ Edit</button>
                      <button onClick={() => setDeleteTarget(c)} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20">🗑️ Delete</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!classes.length && <p className="py-12 text-center text-sm font-bold uppercase tracking-widest" style={{ color: "var(--color-text-faint)" }}>No classes yet.</p>}
        </div>
      </motion.div>

      <Modal open={open} onClose={() => setOpen(false)} title={editTarget ? "Edit Class" : "New Class"}>
        <div className="space-y-5 p-2">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Class Name</label>
            <input className="input" placeholder="e.g., SYCS-A" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Department</label>
            <input className="input" placeholder="e.g., Computer Science" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Student Strength</label>
            <input className="input" type="number" placeholder="e.g., 60" value={form.student_strength} onChange={(e) => setForm({ ...form, student_strength: e.target.value })} />
          </div>
          <button className="btn w-full mt-4" onClick={save}>{editTarget ? "Save Changes" : "Create Class"}</button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Deletion">
        <div className="space-y-6 p-2 text-center">
          <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>Delete class <span className="text-secondary">"{deleteTarget?.name}"</span>? This cannot be undone.</p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors" onClick={confirmDelete}>Yes, Delete</button>
          </div>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Upload Classes">
        <div className="space-y-5 p-2 text-left">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Upload <strong>CSV / Excel</strong> with columns:<br />
            <code className="text-secondary text-xs">name, department, student_strength</code>
          </p>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Select File</label>
            <input ref={bulkFileRef} type="file" className="input cursor-pointer" />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1 text-sm" onClick={async () => {
              try {
                const res = await client.get("/bulk/template/classes", { responseType: "blob" });
                const url = URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement("a"); a.href = url; a.download = "classes_template.csv"; a.click();
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
