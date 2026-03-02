import { motion } from "framer-motion";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

export default function LandingPage() {
    const { user } = useAuth();
    // Redirect to dashboard if already logged in
    if (user) {
        if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
        if (user.role === "teacher") return <Navigate to="/teacher" replace />;
        return <Navigate to="/student" replace />;
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-secondary/30 selection:text-secondary">
            {/* ─── Static Background ─────────────────────────────────────────── */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/5 blur-[120px]" />
            </div>

            {/* ─── Navigation ───────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-[100] bg-[#050505]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-gold-dark flex items-center justify-center text-xl shadow-[0_0_20px_rgba(197,160,34,0.3)]">
                            ⚡
                        </div>
                        <span className="font-heading text-xl font-black tracking-tighter">
                            Smart<span className="text-secondary">Timetable</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-8">
                        <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-all">LOGIN</Link>
                        <Link to="/register" className="btn !py-2.5 !px-8 text-[11px] font-black tracking-[0.1em]">GET STARTED</Link>
                    </div>
                </div>
            </nav>

            {/* ─── Hero Section ─────────────────────────────────────────────── */}
            <main className="relative z-10 pt-48 pb-32 px-8">
                <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-10"
                    >
                        2026 EDITION • AI-FIRST SCHEDULING
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-heading text-7xl md:text-[8rem] font-black tracking-tighter mb-10 leading-[0.9] text-white uppercase"
                    >
                        Effortless <br />
                        <span className="text-secondary">
                            Academic
                        </span> <br />
                        Scheduling.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-slate-300 text-lg md:text-xl max-w-3xl mb-16 leading-relaxed font-medium"
                    >
                        Master the complex puzzle of institutional scheduling.
                        Our engine resolves thousands of constraints in seconds.
                    </motion.p>

                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <Link to="/register" className="btn !px-12 !py-6 text-xl shadow-lg">
                            START GENERATING FREE
                        </Link>
                        <Link to="/login" className="btn-secondary !px-12 !py-6 text-xl border-white/20 hover:bg-white/5 backdrop-blur-md">
                            ADMIN PORTAL
                        </Link>
                    </div>
                </div>

                {/* ─── Trust Bar ─────────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="mt-40 text-center"
                >
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-10">TRUSTED BY INNOVATIVE INSTITUTIONS</p>
                    <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
                        {["ACADEMY", "POLYTECH", "INSTITUTE", "COLLEGE", "UNI"].map(name => (
                            <span key={name} className="font-heading text-2xl font-black tracking-tighter italic">{name}</span>
                        ))}
                    </div>
                </motion.div>

                {/* ─── Feature Showcase ────────────────────────────────────────── */}
                <div className="grid md:grid-cols-3 gap-10 mt-48 max-w-7xl mx-auto">
                    {[
                        {
                            title: "AI-Powered Logic",
                            desc: "Intelligent conflict resolution ensures zero teacher overlaps and optimized room utilization.",
                            icon: "🧠",
                            color: "from-purple-500/20"
                        },
                        {
                            title: "6-Step Guided Flow",
                            desc: "A surgical, step-by-step process that takes you from raw data to active deployment.",
                            icon: "🛤️",
                            color: "from-secondary/20"
                        },
                        {
                            title: "Instant Substitution",
                            desc: "Real-time teacher absence detection with intelligent substitute suggestions.",
                            icon: "⚡",
                            color: "from-blue-500/20"
                        }
                    ].map((feature, i) => (
                        <FeatureCard key={i} {...feature} index={i} />
                    ))}
                </div>

                {/* ─── Stats Section ───────────────────────────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mt-48 glass-card-premium p-16 grid md:grid-cols-4 gap-12 text-center max-w-7xl mx-auto"
                >
                    <StatItem value="99.9%" label="Conflict Detection" />
                    <StatItem value="< 2s" label="Generation Time" />
                    <StatItem value="10k+" label="Schedules Active" />
                    <StatItem value="24/7" label="Cloud Sync" />
                </motion.div>

                {/* ─── Role Portals ───────────────────────────────────────────── */}
                <div className="mt-48 space-y-20 max-w-7xl mx-auto">
                    <div className="text-center space-y-4">
                        <h2 className="font-heading text-5xl font-black uppercase tracking-tight">Institutional Symmetry</h2>
                        <p className="text-slate-500 text-xl font-medium">A tailored experience for every member of your faculty.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <RoleCard
                            role="Administrators"
                            features={["Bulk Data Migration", "Advanced Version Control", "Live Substitute Engine"]}
                            icon="🏰"
                            color="border-secondary/20"
                        />
                        <RoleCard
                            role="Teachers"
                            features={["Personal Timeline", "Smart Availability", "Instant Absence Sync"]}
                            icon="🎓"
                            color="border-blue-500/20"
                        />
                        <RoleCard
                            role="Students"
                            features={["Native Schedule View", "Real-time Updates", "Pro Export (PDF/XLS)"]}
                            icon="🎒"
                            color="border-emerald-500/20"
                        />
                    </div>
                </div>
            </main>

            {/* ─── Footer ──────────────────────────────────────────────────── */}
            <footer className="relative z-10 border-t border-white/5 bg-[#050505]/80 backdrop-blur-2xl py-20 mt-32">
                <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-3 gap-12 items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-lg shadow-[0_0_15px_rgba(197,160,34,0.3)] text-black font-black">⚡</div>
                        <span className="font-heading font-black text-xl tracking-tighter">SmartTimetable</span>
                    </div>
                    <p className="text-slate-500 text-sm text-center font-medium">© 2026 SMART TIMETABLE GENERATOR. <br />ENGINEERED FOR EXCELLENCE.</p>
                    <div className="flex gap-8 justify-end">
                        <a href="#" className="text-[10px] font-black tracking-widest text-slate-500 hover:text-white transition-colors">PRIVACY</a>
                        <a href="#" className="text-[10px] font-black tracking-widest text-slate-500 hover:text-white transition-colors">TERMS</a>
                        <a href="#" className="text-[10px] font-black tracking-widest text-slate-500 hover:text-white transition-colors">CONTACT</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ title, desc, icon, color, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 * index }}
            className={`glass-card-premium p-12 group relative overflow-hidden border-white/5 hover:border-secondary/20 transition-all duration-500`}
        >
            <div className="absolute -right-4 -top-4 text-9xl opacity-[0.02] group-hover:opacity-[0.1] transition-opacity duration-700 grayscale">
                {icon}
            </div>
            <div className="text-5xl mb-8">{icon}</div>
            <h3 className="font-heading text-3xl font-black mb-5 uppercase tracking-tighter text-white">{title}</h3>
            <p className="text-slate-300 leading-relaxed text-lg font-medium">{desc}</p>

            {/* Corner Glow */}
            <div className={`absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-br ${color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
        </motion.div>
    );
}

function StatItem({ value, label }) {
    return (
        <div className="space-y-2">
            <h4 className="text-5xl md:text-6xl font-black text-secondary tracking-tighter">{value}</h4>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{label}</div>
        </div>
    );
}

function RoleCard({ role, features, icon, color }) {
    return (
        <div className={`glass-card-premium p-10 border-white/5 hover:${color} transition-all duration-500 group`}>
            <div className="flex items-center gap-5 mb-8">
                <div className="text-4xl">{icon}</div>
                <h3 className="font-heading text-2xl font-black uppercase tracking-tighter text-white">{role}</h3>
            </div>
            <ul className="space-y-5">
                {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-4 text-slate-300 text-base font-medium">
                        <span className="text-secondary text-lg">✓</span> {f}
                    </li>
                ))}
            </ul>
        </div>
    );
}
