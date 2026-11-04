import { Navigate, Route, Routes } from "react-router";
import AppShell from "./components/AppShell.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import NotesPage from "./pages/NotesPage.jsx";
import OverviewPage from "./pages/OverviewPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import TasksPage from "./pages/TasksPage.jsx";

export default function App() {
  return (
    <div className="min-h-dvh bg-canvas font-sans text-sm text-ink">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/tasks" replace />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/overview" element={<OverviewPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
