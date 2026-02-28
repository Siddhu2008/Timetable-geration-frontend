import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const navItems = [
    { id: "dashboard", label: "Overview", icon: "🏠", path: "/admin/dashboard", roles: ["admin"] },
    { id: "teachers", label: "Teachers", icon: "👨‍🏫", path: "/admin/teachers", roles: ["admin"] },
    { id: "classes", label: "Classes", icon: "🏫", path: "/admin/classes", roles: ["admin"] },
    { id: "subjects", label: "Subjects", icon: "📚", path: "/admin/subjects", roles: ["admin"] },
    { id: "rooms", label: "Rooms", icon: "🏛️", path: "/admin/rooms", roles: ["admin"] },
    { id: "timetable", label: "Timetable", icon: "📅", path: "/admin/timetable", roles: ["admin"] },
    { id: "settings", label: "Settings", icon: "⚙️", path: "/admin/settings", roles: ["admin"] },
    { id: "teacher-schedule", label: "My Schedule", icon: "📅", path: "/teacher", roles: ["teacher"] },
    { id: "student-grid", label: "My Timetable", icon: "🗺️", path: "/student", roles: ["student"] },
];

export default function Sidebar({ dark, setDark, mobile = false }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const filteredItems = navItems.filter(item => item.roles.includes(user?.role));

    return (
        <aside
            className={`${mobile ? "flex" : "hidden lg:flex"} fixed left-0 top-0 z-50 h-screen w-64 flex-col justify-between overflow-y-auto border-r backdrop-blur-3xl px-4 py-8`}
            style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
            }}
        >
            <div className="space-y-10">
                <Link to="/" className="block px-2">
                    <h1 className="royal-header font-heading text-2xl font-bold tracking-tighter">
                        Smart <br /> Timetable
                    </h1>
                </Link>

                <nav className="space-y-1">
                    {filteredItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link key={item.id} to={item.path}>
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    className={`group relative flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-300`}
                                    style={isActive
                                        ? {
                                            background: "linear-gradient(to right, rgba(197,160,34,0.2), transparent)",
                                            color: "#c5a022",
                                            boxShadow: "0 0 20px rgba(197,160,34,0.08)",
                                        }
                                        : {
                                            color: "var(--color-text-muted)",
                                        }
                                    }
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute left-0 h-full w-1 rounded-full bg-secondary"
                                        />
                                    )}
                                    <span className="text-xl group-hover:drop-shadow-[0_0_6px_rgba(197,160,34,0.6)]">
                                        {item.icon}
                                    </span>
                                    <span
                                        className="text-sm font-bold uppercase tracking-widest"
                                        style={{ color: isActive ? "#c5a022" : "var(--color-text-muted)" }}
                                    >
                                        {item.label}
                                    </span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* User Profile Panel */}
            <div
                className="space-y-4 rounded-2xl border p-4"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface-hover)" }}
            >
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/20 font-bold text-secondary">
                        {user?.username?.[0]?.toUpperCase() || "A"}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-bold" style={{ color: "var(--color-text)" }}>{user?.username}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-secondary/70">
                            {user?.role}
                        </p>
                    </div>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={() => setDark((v) => !v)}
                    className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs transition-colors"
                    style={{
                        borderColor: "var(--color-border)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-text-muted)",
                    }}
                >
                    <span>{dark ? "Light Oracle" : "Deep Night"}</span>
                    <span>{dark ? "☀️" : "🌙"}</span>
                </button>

                <button
                    onClick={logout}
                    className="btn w-full !px-2 !py-2 text-[10px] shadow-none"
                >
                    Relinquish Access
                </button>
            </div>
        </aside>
    );
}
