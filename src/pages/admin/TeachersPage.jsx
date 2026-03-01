import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import client from "../../api/client";
import Modal from "../../components/Modal";
import { useUi } from "../../context/UiContext";

const EMPTY = { name: "", max_lectures_per_day: 6, subjectIds: [] };

export default function TeachersPage() {
  const [open, setOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [neededSubstitutes, setNeededSubstitutes] = useState([]);
  const [subAssignment, setSubAssignment] = useState({}); // entry_id -> target_teacher_id
  const [form, setForm] = useState(EMPTY);
  const bulkFileRef = useRef(null);
  const { showLoader, hideLoader, toast } = useUi();

  const load = async () => {
    const [t, s, m, subReqs] = await Promise.all([
      client.get("/teachers"),
      client.get("/subjects"),
      client.get("/teacher-subjects"),
      client.get("/timetable/substitutes/needed").catch(() => ({ data: [] })),
    ]);
    setTeachers(t.data); setSubjects(s.data); setMappings(m.data); setNeededSubstitutes(subReqs.data);
  };

  useEffect(() => {
    (async () => {
      showLoader("Loading teachers...");
      try { await load(); } catch { toast("Failed to load teachers", "error"); } finally { hideLoader(); }
    })();
  }, []);

  const subjectById = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects]);
  const subjectsForTeacher = (tid) =>
    mappings.filter((m) => m.teacher_id === tid).map((m) => subjectById[m.subject_id]?.name).filter(Boolean).join(", ");

  const openCreate = () => { setEditTarget(null); setForm(EMPTY); setOpen(true); };
  const openEdit = (t) => {
    const sids = mappings.filter((m) => m.teacher_id === t.id).map((m) => m.subject_id);
    setEditTarget(t);
    setForm({ name: t.name, max_lectures_per_day: t.max_lectures_per_day, subjectIds: sids });
    setOpen(true);
  };

  const save = async () => {
    showLoader(editTarget ? "Updating teacher..." : "Creating teacher...");
    try {
      if (editTarget) {
        await client.put(`/teachers/${editTarget.id}`, {
          name: form.name,
          max_lectures_per_day: Number(form.max_lectures_per_day),
        });
        // Add new subject mappings
        for (const sid of form.subjectIds) {
          await client.post(`/teachers/${editTarget.id}/subjects`, { subject_id: sid });
        }
        toast("Teacher updated", "success");
      } else {
        const { data } = await client.post("/teachers", { name: form.name, max_lectures_per_day: Number(form.max_lectures_per_day) });
        for (const sid of form.subjectIds) {
          await client.post(`/teachers/${data.id}/subjects`, { subject_id: sid });
        }
        toast("Teacher added", "success");
      }
      setOpen(false); setForm(EMPTY); await load();
    } catch (e) { toast(e.response?.data?.error || "Failed to save teacher", "error"); }
    finally { hideLoader(); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    showLoader("Deleting teacher...");
    try {
      await client.delete(`/teachers/${deleteTarget.id}`);
      toast("Teacher deleted", "success"); setDeleteTarget(null); await load();
    } catch (e) { toast(e.response?.data?.error || "Failed to delete teacher", "error"); }
    finally { hideLoader(); }
  };

  const uploadBulk = async () => {
    const file = bulkFileRef.current?.files?.[0];
    if (!file) { toast("Select a file first", "warning"); return; }
    const fd = new FormData();
    fd.append("target", "teachers");
    fd.append("file", file);
    showLoader("Uploading teachers...");
    try {
      const { data } = await client.post("/bulk/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast(`Imported ${data.rows_imported} / ${data.rows_read} rows`, "success");
      setBulkOpen(false);
      if (bulkFileRef.current) bulkFileRef.current.value = "";
      await load();
    } catch (e) { toast(e.response?.data?.error || "Bulk upload failed", "error"); }
    finally { hideLoader(); }
  };

  const assignSubstitute = async (entryId) => {
    const targetDid = subAssignment[entryId];
    if (!targetDid) { toast("Select a substitute first", "warning"); return; }
    showLoader("Assigning substitute...");
    try {
      await client.post("/timetable/substitutes/assign", { entry_id: entryId, substitute_teacher_id: Number(targetDid) });
      toast("Substitute assigned. Schedule updated.", "success");
      await load();
    } catch { toast("Failed to assign substitute", "error"); }
    finally { hideLoader(); }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <h2 className="royal-header font-heading text-4xl font-bold tracking-tight">Teachers</h2>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>Manage your teaching staff.</p>
        </motion.div>
        <div className="flex gap-3">
          <button className="btn-secondary text-sm px-5 py-2.5 flex items-center gap-2" onClick={() => setBulkOpen(true)}>
            📤 Bulk Upload
          </button>
          <button className="btn relative overflow-hidden group shadow-[0_10px_30px_rgba(197,160,34,0.2)]" onClick={openCreate}>
            <span className="relative z-10 flex items-center gap-2"><span>✨</span> Add Teacher</span>
            <div className="absolute inset-0 bg-gradient-to-r from-secondary to-gold-dark opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      {neededSubstitutes.length > 0 && (
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card overflow-hidden border-rose-500/20 bg-rose-500/5">
          <div className="border-b border-rose-500/10 px-6 py-4 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <h3 className="font-heading text-lg font-bold text-rose-400">Absences Detected: Substitutes Required</h3>
          </div>
          <div className="p-6 space-y-4">
            {neededSubstitutes.map(sub => (
              <div key={sub.entry_id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-white/5 bg-white/5 p-4">
                <div>
                  <div className="text-sm font-bold text-slate-300">
                    <span className="text-rose-400">{sub.absent_teacher_name}</span> is absent for <span className="text-secondary">{sub.subject_name}</span> ({sub.class_name})
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 mt-1">
                    {sub.day}, {sub.time}
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <select
                    className="input !py-2 !text-xs flex-1 md:w-48"
                    value={subAssignment[sub.entry_id] || ""}
                    onChange={(e) => setSubAssignment(prev => ({ ...prev, [sub.entry_id]: e.target.value }))}
                  >
                    <option value="">Select Substitute...</option>
                    {sub.available_substitutes.map(avail => (
                      <option key={avail.id} value={avail.id}>{avail.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => assignSubstitute(sub.entry_id)}
                    className="btn !py-2 !px-4 !text-xs whitespace-nowrap"
                  >
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card relative p-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
        <div className="overflow-x-auto p-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b text-[10px] font-black uppercase tracking-[0.2em]" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>
                <th className="pb-5">Name</th>
                <th className="pb-5 text-center">Lectures / Day</th>
                <th className="pb-5">Subjects</th>
                <th className="pb-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t, idx) => (
                <motion.tr key={t.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * idx }}
                  className="border-b transition-all" style={{ borderColor: "var(--color-border)" }}>
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20 font-bold text-secondary text-sm">
                        {t.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="font-bold text-sm" style={{ color: "var(--color-text)" }}>{t.name}</span>
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="rounded-xl border px-3 py-1.5 font-black text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
                      {t.max_lectures_per_day}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {subjectsForTeacher(t.id) ? subjectsForTeacher(t.id).split(", ").map((sub, i) => (
                        <span key={i} className="rounded-lg border border-secondary/20 bg-secondary/5 px-2 py-0.5 text-[10px] font-black uppercase text-secondary">{sub}</span>
                      )) : <span className="text-xs italic" style={{ color: "var(--color-text-faint)" }}>No subjects yet</span>}
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(t)} className="rounded-lg border px-3 py-1.5 text-xs font-bold transition-all hover:border-secondary/50 hover:text-secondary"
                        style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}>✏️ Edit</button>
                      <button onClick={() => setDeleteTarget(t)} className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20">🗑️ Delete</button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {!teachers.length && <p className="py-10 text-center text-sm font-bold uppercase tracking-widest" style={{ color: "var(--color-text-faint)" }}>No teachers yet.</p>}
        </div>
      </motion.div>

      {/* Create / Edit Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editTarget ? "Edit Teacher" : "Add Teacher"}>
        <div className="space-y-5 p-2 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Full Name</label>
            <input className="input" placeholder="e.g., Dr. John Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Max Lectures / Day</label>
            <input className="input" type="number" min="1" value={form.max_lectures_per_day}
              onChange={(e) => setForm({ ...form, max_lectures_per_day: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>
              Assign Subjects <span className="normal-case font-normal text-[9px]">(Ctrl+Click for multiple)</span>
            </label>
            <select className="input !h-36" multiple size={6}
              value={form.subjectIds.map(String)}
              onChange={(e) => setForm({ ...form, subjectIds: Array.from(e.target.selectedOptions).map((o) => Number(o.value)) })}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button className="btn w-full mt-2" onClick={save}>{editTarget ? "Save Changes" : "Add Teacher"}</button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirm Deletion">
        <div className="space-y-6 p-2 text-center">
          <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
            Delete <span className="text-secondary">"{deleteTarget?.name}"</span>? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="flex-1 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 transition-colors" onClick={confirmDelete}>Yes, Delete</button>
          </div>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Upload Teachers">
        <div className="space-y-5 p-2 text-left">
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Upload a <strong>CSV</strong> or <strong>Excel (.xlsx)</strong> file with columns:<br />
            <code className="text-secondary text-xs">name, max_lectures_per_day</code>
          </p>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest ml-1" style={{ color: "var(--color-text-muted)" }}>Select File</label>
            <input ref={bulkFileRef} type="file" className="input cursor-pointer" />
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1 text-sm" onClick={async () => {
              try {
                const res = await client.get("/bulk/template/teachers", { responseType: "blob" });
                const url = URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement("a"); a.href = url; a.download = "teachers_template.csv"; a.click();
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
