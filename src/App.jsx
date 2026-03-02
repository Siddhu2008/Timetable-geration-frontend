import { AnimatePresence, motion } from "framer-motion";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import { useUi } from "./context/UiContext";
import ToastStack from "./components/ToastStack";
import GlobalLoader from "./components/GlobalLoader";
import AppLayout from "./pages/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StudentPage from "./pages/StudentPage";
import TeacherPage from "./pages/TeacherPage";
import DashboardPage from "./pages/admin/DashboardPage";
import TeachersPage from "./pages/admin/TeachersPage";
import ClassesPage from "./pages/admin/ClassesPage";
import SubjectsPage from "./pages/admin/SubjectsPage";
import RoomsPage from "./pages/admin/RoomsPage";
import TimetablePage from "./pages/admin/TimetablePage";
import SettingsPage from "./pages/admin/SettingsPage";
import LandingPage from "./pages/LandingPage";

export default function App() {
  const { user } = useAuth();
  const { toasts, busy, busyText } = useUi();
  const location = useLocation();

  return (
    <div className="min-h-screen selection:bg-secondary/30 selection:text-secondary" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Routes location={location}>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Routes inside AppLayout */}
            <Route element={<ProtectedRoute roles={["admin", "teacher", "student"]}><AppLayout /></ProtectedRoute>}>
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={<ProtectedRoute roles={["admin"]}><DashboardPage /></ProtectedRoute>} />
              <Route path="/admin/teachers" element={<ProtectedRoute roles={["admin"]}><TeachersPage /></ProtectedRoute>} />
              <Route path="/admin/classes" element={<ProtectedRoute roles={["admin"]}><ClassesPage /></ProtectedRoute>} />
              <Route path="/admin/subjects" element={<ProtectedRoute roles={["admin"]}><SubjectsPage /></ProtectedRoute>} />
              <Route path="/admin/rooms" element={<ProtectedRoute roles={["admin"]}><RoomsPage /></ProtectedRoute>} />
              <Route path="/admin/timetable" element={<ProtectedRoute roles={["admin"]}><TimetablePage /></ProtectedRoute>} />
              <Route path="/admin/settings" element={<ProtectedRoute roles={["admin"]}><SettingsPage /></ProtectedRoute>} />

              {/* Teacher Routes */}
              <Route path="/teacher" element={<ProtectedRoute roles={["teacher"]}><TeacherPage /></ProtectedRoute>} />

              {/* Student Routes */}
              <Route path="/student" element={<ProtectedRoute roles={["student"]}><StudentPage /></ProtectedRoute>} />
            </Route>

            {/* Catch-all redirect to Landing */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <ToastStack toasts={toasts} />
      <GlobalLoader busy={busy} text={busyText} />
    </div>
  );
}
