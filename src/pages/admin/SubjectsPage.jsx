import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import client from "../../api/client";
import Modal from "../../components/Modal";
import { useUi } from "../../context/UiContext";

const EMPTY = { name: "", class_ids: [], lectures_per_week: 4, priority_morning: false, is_lab: false };

export default function SubjectsPage() {
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const bulkFileRef = useRef(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const { showLoader, hideLoader, toast } = useUi();

  const load = async () => {
    const [s, c] = await Promise.all([client.get("/subjects"), client.get("/classes")]);
    setSubjects(s.data); setClasses(c.data);
  };

  useEffect(() => {
    (async () => {
      showLoader("Loading subjects...");
      try { await load(); } catch { toast("Failed to load subjects", "error"); } finally { hideLoader(); }
    })();
  }, []);

  const classById = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c])), [classes]);

  const openCreate = () => { setEditTarget(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (s) => {
    setEditTarget(s);
    setForm({
      name: s.name,
      class_ids: s.class_ids?.length ? s.class_ids.map(String) : (s.class_id ? [String(s.class_id)] : []),
      lectures_per_week: s.lectures_per_week,
      priority_morning: s.priority_morning,
      is_lab: s.is_lab,
    });
    setOpen(true);
  };

  const toggleClassId = (id) => {
    const sid = String(id);
    setForm((prev) => ({
      ...prev,
      class_ids: prev.class_ids.includes(sid)
        ? prev.class_ids.filter((x) => x !== sid)
        : [...prev.class_ids, sid],
    }));
  };

  const save = async () => {
    if (!form.class_ids.length) { toast("Select at least one class", "warning"); return; }
    showLoader(editTarget ? "Updating subject..." : "Adding subject...");
    try {
      const payload = {
        name: form.name,
        class_id: Number(form.class_ids[0]),  // primary class (backward compat)
        class_ids: form.class_ids.map(Number),
        lectures_per_week: Number(form.lectures_per_week),
        priority_morning: form.priority_morning,
        is_lab: form.is_lab,
      };
      if (editTarget) {
        await client.put(`/subjects/${editTarget.id}`, payload);
        toast("Subject updated", "success");
      } else {
        await client.post("/subjects", payload);
        toast("Subject added", "success");
      }
      setOpen(false); setForm(EMPTY); await load();
    } catch (e) { toast(e.response?.data?.error || "Failed to save subject", "error"); }
    finally { hideLoader(); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    showLoader("Deleting subject...");
    try {
      await client.delete(`/subjects/${deleteTarget.id}`);
      toast("Subject deleted", "success"); setDeleteTarget(null); await load();
    } catch (e) { toast(e.response?.data?.error || "Failed to delete subject", "error"); }
    finally { hideLoader(); }
  };

  const Checkbox = ({ checked, onChange, label, color = "bg-secondary border-secondary" }) => (
    <label className="flex items-center gap-3 text-xs font-bold cursor-pointer" style={{ color: "var(--color-text)" }}>
      <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
      <div className={`h-5 w-5 rounded border transition-all flex items-center justify-center ${checked ? color : ""}`}
        style={!checked ? { borderColor: "var(--color-border)", background: "var(--color-surface)" } : {}}>
        {checked && <span className="text-white text-xs">✓</span>}
      </div>
      {label}
    </label>
  );

  const uploadBulk = async () => {
    const file = bulkFileRef.current?.files?.[0];
    if (!file) { toast("Select a file first", "warning"); return; }
    const fd = new FormData();
    fd.append("target", "subjects");
    fd.append("file", file);
    showLoader("Uploading subjects...");
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
          <h2 className="royal-header font-heading text-4xl font-bold tracking-tight">Subjects</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>Manage subjects and assign them to one or more classes.</p>
        </motion.div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2" onClick={() => setBulkOpen(true)}>📤 Bulk Upload</button>
          <button className="btn relative overflow-hidden group shadow-[0_10px_30px_rgba(197,160,34,0.2)]" onClick={openCreate}>
            <span className="relative z-10 flex items-center gap-2"><span>📚</span> Add Subject</span>
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
                <th className="pb-6">Subject Name</th>
                <th className="pb-6">Classes</th>
                <th className="pb-6 text-center">Per Week</th>
                <th className="pb-6">Type</th>
                <th className="pb-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s, idx) => {
                const linkedClasses = (s.class_ids?.length ? s.class_ids : (s.class_id ? [s.class_id] : []));
                return (
                  <motion.tr key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx }}
                    className="border-b transition-all" style={{ borderColor: "var(--color-border)" }}>
                    <td className="py-5 font-heading text-base font-bold" style={{ color: "var(--color-text)" }}>{s.name}</td>
                    <td className="py-5">
                      <div className="flex flex-wrap gap-1">
                        {linkedClasses.length ? linkedClasses.map((cid) => (
                          <span key={cid} className="rounded-md border px-2 py-0.5 text-[10px] font-bold" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                            {classById[cid]?.name || `#${cid}`}
                          </span>
                        )) : <span className="text-xs text-red-400">No class</span>}
                      </div>
                    </td>
                    <td className="py-5 text-center">
                      <div className="flex justify-center items-center gap-1">
                        {[...Array(Math.min(s.lectures_per_week, 7))].map((_, i) => (
                          <div key={i} className="h-2 w-2 rounded-full bg-secondary" />
                        ))}
                        <span className="ml-2 text-xs font-black" style={{ color: "var(--color-text-muted)" }}>{s.lectures_per_week}</span>
                      </div>
                    </td>
                    <td className="py-5">
                      <span className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase tracking-widest ${s.is_lab ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-blue-500/20 text-blue-400 border border-blue-500/30"}`}>
                        {s.is_lab ? "Lab" : "Theory"}
                      </span>
                      {s.priority_morning && <span className="ml-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-1 text-[10px] font-black uppercase">AM Priority</span>}
                    </td>
                    <td className="py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(s)} className="rounded-lg border px-3 py-1.5 text-xs font-bold transition-all hover:border-secondary/50 hover:text-secondary"
                          style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>✏️ Edit</button>
                        <button onClick={() => setDeleteTarget(s)} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20">🗑️ Delete</button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {!subjects.length && <p className="py-12 text-center text-sm font-bold uppercase tracking-widest" style={{ color: "var(--color-text-faint)" }}>No subjects yet.</p>}
        </div>
      </motion.div>

      <Modal open={open} onClose={() => setOpen(false)} title={editTarget ? "Edit Subject" : "Add Subject"}>
        <div className="space-y-5 p-2 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Subject Name</label>
            <input className="input" placeholder="e.g., Mathematics" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Classes (select one or more)</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
              {classes.map((c) => {
                const selected = form.class_ids.includes(String(c.id));
                return (
                  <button key={c.id} type="button"
                    onClick={() => toggleClassId(c.id)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold text-left transition-all ${selected ? "border-secondary bg-secondary/10 text-secondary" : "hover:border-secondary/30"}`}
                    style={!selected ? { borderColor: "var(--color-border)", color: "var(--color-text-muted)" } : {}}>
                    {selected ? "✓ " : ""}{c.name}
                    {c.department && <span className="block text-[9px] opacity-60 mt-0.5">{c.department}</span>}
                  </button>
                );
              })}
            </div>
            {!classes.length && <p className="text-xs text-red-400">No classes found. Add classes first.</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Lectures / Week</label>
            <input className="input" type="number" min="1" placeholder="e.g., 4" value={form.lectures_per_week}
              onChange={(e) => setForm({ ...form, lectures_per_week: e.target.value })} />
          </div>
          <div className="flex gap-6 mt-2">
            <Checkbox checked={form.priority_morning} onChange={(e) => setForm({ ...form, priority_morning: e.target.checked })}
              label="Morning Priority" color="bg-secondary border-secondary" />
            <Checkbox checked={form.is_lab} onChange={(e) => setForm({ ...form, is_lab: e.target.checked })}
              label="Lab Session" color="bg-purple-500 border-purple-500" />
          </div>
          <button className="btn w-full mt-4" onClick={save}>{editTarget ? "Save Changes" : "Add Subject"}</button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Deletion">
        <div className="space-y-6 p-2 text-center">
          <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>Delete subject <span className="text-secondary">"{deleteTarget?.name}"</span>? This cannot be undone.</p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors" onClick={confirmDelete}>Yes, Delete</button>
          </div>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Upload Subjects">
        <div className="space-y-5 p-2 text-left">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Upload <strong>CSV / Excel</strong> with columns:<br />
            <code className="text-secondary text-xs">name, department, lectures_per_week, priority_morning, is_lab</code><br />
            <span className="text-xs mt-1 block opacity-70">Use <strong>department</strong> to auto-assign to all classes in that department. Or use <strong>class_name</strong> for a specific class.</span>
          </p>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Select File</label>
            <input ref={bulkFileRef} type="file" className="input cursor-pointer" accept=".csv,.xlsx" />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1 text-sm" onClick={async () => {
              try {
                const res = await client.get("/bulk/template/subjects", { responseType: "blob" });
                const url = URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement("a"); a.href = url; a.download = "subjects_template.csv"; a.click();
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
