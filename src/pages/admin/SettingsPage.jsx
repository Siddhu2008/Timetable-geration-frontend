import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import client from "../../api/client";
import { useUi } from "../../context/UiContext";

export default function SettingsPage() {
    const { toast, showLoader, hideLoader } = useUi();
    const [settings, setSettings] = useState([]);
    const [forms, setForms] = useState({});

    const loadSettings = async () => {
        try {
            showLoader("Accessing Master Config...");
            const { data } = await client.get("/settings/");
            setSettings(data);
            const initForms = {};
            data.forEach(s => {
                initForms[s.key] = s.value;
            });
            setForms(initForms);
        } catch (e) {
            toast("Failed to load settings", "error");
        } finally {
            hideLoader();
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const handleSave = async () => {
        showLoader("Synchronizing Parameters...");
        try {
            await client.put("/settings/bulk", forms);
            toast("Configuration updated", "success");
            await loadSettings();
        } catch (e) {
            toast(e.response?.data?.error || "Save failed", "error");
        } finally {
            hideLoader();
        }
    };

    const handleChange = (key, value) => {
        setForms(prev => ({ ...prev, [key]: value }));
    };

    const displayNames = {
        max_theory_per_day: "Maximum Theory Lectures / Day",
        max_lab_per_day: "Maximum Practical Blocks / Day",
        max_total_hours: "Maximum Continual Hours / Day",
        short_break_duration: "Short Respite Duration (mins)",
        long_break_duration: "Long Respite Duration (mins)",
        lab_block_duration: "Practical Chunk Size (hours)",
    };

    const icons = {
        max_theory_per_day: "📚",
        max_lab_per_day: "🔬",
        max_total_hours: "⏱️",
        short_break_duration: "☕",
        long_break_duration: "🍽️",
        lab_block_duration: "🧪",
    };

    return (
        <div className="space-y-12 pb-20">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card relative overflow-hidden p-8"
            >
                <div className="absolute right-0 top-0 h-64 w-64 translate-x-32 translate-y--32 rounded-full bg-blue-500/10 blur-3xl" />
                <h2 className="royal-header font-heading text-4xl font-bold tracking-tight text-white mb-2">Master Configuration</h2>
                <p className="text-slate-400 font-medium italic">Define the absolute laws governing the Temporal Generator.</p>
            </motion.div>

            <section className="glass-card p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-8 w-1 bg-blue-500 rounded-full" />
                    <h3 className="font-heading text-2xl font-bold tracking-widest uppercase" style={{ color: "var(--color-text)" }}>Generation Constraints</h3>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {settings.map((s, idx) => (
                        <motion.div
                            key={s.key}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="group relative flex flex-col justify-between rounded-2xl border p-6 transition-all hover:border-blue-500/30 hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.2)]"
                            style={{ background: "var(--color-surface-hover)", borderColor: "var(--color-border)" }}
                        >
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl opacity-80 group-hover:opacity-100 transition-opacity">{icons[s.key] || "⚙️"}</span>
                                    <h4 className="font-heading text-lg font-bold leading-tight" style={{ color: "var(--color-text)" }}>
                                        {displayNames[s.key] || s.key.replace(/_/g, " ")}
                                    </h4>
                                </div>
                                <p className="text-xs font-medium leading-relaxed" style={{ color: "var(--color-text-muted)" }}>{s.description}</p>
                            </div>

                            <div className="mt-auto">
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full rounded-xl border px-4 py-3 text-lg font-black outline-none transition-all focus:border-blue-500/50"
                                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text)" }}
                                    value={forms[s.key] !== undefined ? forms[s.key] : s.value}
                                    onChange={(e) => handleChange(s.key, e.target.value)}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="mt-12 flex justify-end">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSave}
                        className="btn relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-4 font-black tracking-widest text-white shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(37,99,235,0.5)]"
                    >
                        <span className="relative z-10 flex items-center gap-3"><span className="text-xl">💾</span> Enshrine Directives</span>
                    </motion.button>
                </div>
            </section>
        </div>
    );
}
