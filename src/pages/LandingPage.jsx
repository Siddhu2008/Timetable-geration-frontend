import { motion } from "framer-motion";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LandingPage() {
    const { user } = useAuth();

    // Redirect to dashboard if already logged in
    if (user) {
        if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
        if (user.role === "teacher") return <Navigate to="/teacher" replace />;
        return <Navigate to="/student" replace />;
    }

    return (
        <div className="min-h-screen overflow-hidden bg-[#0a0a0c] text-white">
            {/* Background Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
            </div>

            {/* Navigation */}
            <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-gold-dark flex items-center justify-center text-2xl shadow-lg shadow-secondary/20">
                        ⚡
                    </div>
                    <span className="font-heading text-xl font-bold tracking-tighter">
                        Smart<span className="text-secondary">Timetable</span>
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-6"
                >
                    <Link to="/login" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">Login</Link>
                    <Link to="/register" className="btn !py-2 !px-6 text-sm">Get Started</Link>
                </motion.div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32">
                <div className="flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-secondary mb-8"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                        </span>
                        Next Generation Scheduling
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="font-heading text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[0.9]"
                    >
                        Effortless <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-gold-dark to-secondary animate-gradient-x">
                            Academic
                        </span> <br />
                        Scheduling.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed"
                    >
                        Say goodbye to conflicts and manual planning. Our AI-driven engine generates
                        optimized, student-first timetables in seconds, not weeks.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-wrap items-center justify-center gap-4"
                    >
                        <Link to="/register" className="btn !px-10 !py-5 text-lg shadow-[0_20px_40px_rgba(197,160,34,0.3)]">
                            Start Generating Free
                        </Link>
                        <Link to="/login" className="btn-secondary !px-10 !py-5 text-lg border-white/10 hover:bg-white/5">
                            Admin Portal
                        </Link>
                    </motion.div>
                </div>

                {/* Feature Cards */}
                <div className="grid md:grid-cols-3 gap-8 mt-40">
                    {[
                        {
                            title: "AI-Powered Logic",
                            desc: "Intelligent conflict resolution ensures no teacher or room overlaps, ever.",
                            icon: "🧠",
                            color: "from-purple-500/20"
                        },
                        {
                            title: "Step-by-Step Flow",
                            desc: "Guided 6-step process from data upload to active timetable deployment.",
                            icon: "🛤️",
                            color: "from-secondary/20"
                        },
                        {
                            title: "Real-time Absence",
                            desc: "Instant substitute suggestions when teachers are away. Never miss a lecture.",
                            icon: "⚡",
                            color: "from-blue-500/20"
                        }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.1 * i }}
                            className={`glass-card p-10 group relative overflow-hidden bg-gradient-to-br ${feature.color} to-transparent border-white/5 hover:border-white/10 transition-all`}
                        >
                            <div className="absolute -right-4 -top-4 text-8xl opacity-[0.03] group-hover:opacity-[0.07] transition-opacity grayscale">
                                {feature.icon}
                            </div>
                            <div className="text-4xl mb-6">{feature.icon}</div>
                            <h3 className="font-heading text-2xl font-bold mb-4">{feature.title}</h3>
                            <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Role Previews */}
                <div className="mt-40 space-y-12">
                    <div className="text-center">
                        <h2 className="font-heading text-4xl font-bold mb-4">Portals for Everyone</h2>
                        <p className="text-slate-500 text-lg">A unified experience for the entire institution.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <RoleCard
                            role="Administrators"
                            features={["Bulk Data Import", "Version Control", "Substitute Management"]}
                            icon="🏰"
                        />
                        <RoleCard
                            role="Teachers"
                            features={["Personal Schedule", "Availability Control", "Absence Requests"]}
                            icon="🎓"
                        />
                        <RoleCard
                            role="Students"
                            features={["Interactive View", "Real-time Updates", "Download PDF/Excel"]}
                            icon="🎒"
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 bg-black/50 backdrop-blur-xl py-12">
                <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-lg">⚡</div>
                        <span className="font-heading font-bold">SmartTimetable</span>
                    </div>
                    <p className="text-slate-500 text-sm">© 2026 Smart Timetable Generator. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">Privacy</a>
                        <a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">Terms</a>
                        <a href="#" className="text-slate-500 hover:text-white transition-colors text-sm">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function RoleCard({ role, features, icon }) {
    return (
        <div className="glass-card p-8 border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-4 mb-6">
                <div className="text-3xl">{icon}</div>
                <h3 className="font-heading text-xl font-bold">{role}</h3>
            </div>
            <ul className="space-y-3">
                {features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-400 text-sm">
                        <span className="text-secondary">✓</span> {f}
                    </li>
                ))}
            </ul>
        </div>
    );
}
