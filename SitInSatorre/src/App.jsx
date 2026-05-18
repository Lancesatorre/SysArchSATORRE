import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from './Pages/LoginPage';
import LayoutNav from "./Components/LayoutNav";
import Landing from "./Pages/Landing";
import SignUp from "./Pages/SignUp";
import Dashboard from "./Student/Dashboard";
import StudentProfile from "./Student/StudentProfile";
import SessionHistory from "./Student/SessionHistory";
import SessionRecords from "./Student/SessionRecords";
import Reservations from "./Student/Reservations";
import SoftwareAvailability from "./Student/SoftwareAvailability";
import AdminOverview from "./Admin/AdminOverview";
import CreateAnnouncement from "./Admin/CreateAnnouncement";
import AnnouncementRecords from "./Admin/AnnouncementRecords";
import SearchStudent from "./Admin/SearchStudent";
import CurrentSessions from "./Admin/CurrentSessions";
import SitInRecords from "./Admin/SitInRecords";
import AdminReservations from "./Admin/AdminReservations";
import SoftwareManagement from "./Admin/SoftwareManagement";
import GenerateReports from "./Admin/GenerateReports";
import { authService } from "./services/authService";
import { ThemeProvider } from "./services/ThemeContext";
import FloatingThemeToggle from "./Components/FloatingThemeToggle";
import StudentTestimonials from "./Student/Testimonials";
import AdminTestimonials from "./Admin/Testimonials";


function RequireAuth({ children, role }) {
  const isLoggedIn = authService.isLoggedIn();
  const user = authService.getUser();

  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  if (role && user.role !== role) {
    const safeHome = user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    return <Navigate to={safeHome} replace />;
  }

  return children;
}

function RedirectIfAuthenticated({ children }) {
  const isLoggedIn = authService.isLoggedIn();
  const user = authService.getUser();

  if (isLoggedIn && user) {
    const safeHome = user.role === 'admin' ? '/admin/dashboard' : '/student/dashboard';
    return <Navigate to={safeHome} replace />;
  }

  return children;
}


function App() {
  return (
    <ThemeProvider>
      <Router>
        <FloatingThemeToggle />
        <Routes>
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <LoginPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="/signup"
            element={
              <RedirectIfAuthenticated>
                <SignUp />
              </RedirectIfAuthenticated>
            }
          />
          <Route element={<LayoutNav />}>
             <Route path="/" element={<RedirectIfAuthenticated><Landing /></RedirectIfAuthenticated>} />
              <Route
                path="/admin/dashboard"
                element={
                  <RequireAuth role="admin">
                    <AdminOverview />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/search-student"
                element={
                  <RequireAuth role="admin">
                    <SearchStudent />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/current-sessions"
                element={
                  <RequireAuth role="admin">
                    <CurrentSessions />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/sit-in-records"
                element={
                  <RequireAuth role="admin">
                    <SitInRecords />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/create-announcement"
                element={
                  <RequireAuth role="admin">
                    <CreateAnnouncement />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/announcement-records"
                element={
                  <RequireAuth role="admin">
                    <AnnouncementRecords />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/reservations"
                element={
                  <RequireAuth role="admin">
                    <AdminReservations />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/software-management"
                element={
                  <RequireAuth role="admin">
                    <SoftwareManagement />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/generate-reports"
                element={
                  <RequireAuth role="admin">
                    <GenerateReports />
                  </RequireAuth>
                }
              />
              <Route
                path="/student/dashboard"
                element={
                  <RequireAuth role="student">
                    <Dashboard />
                  </RequireAuth>
                }
              />
              <Route
                path="/student/profile"
                element={
                  <RequireAuth role="student">
                    <StudentProfile />
                  </RequireAuth>
                }
              />
              <Route
                path="/student/history"
                element={
                  <RequireAuth role="student">
                    <SessionHistory />
                  </RequireAuth>
                }
              />
              <Route
                path="/student/records"
                element={
                  <RequireAuth role="student">
                    <SessionRecords />
                  </RequireAuth>
                }
              />
              <Route
                path="/student/reservation"
                element={
                  <RequireAuth role="student">
                    <Reservations />
                  </RequireAuth>
                }
              />
              <Route
                path="/student/software-availability"
                element={
                  <RequireAuth role="student">
                    <SoftwareAvailability />
                  </RequireAuth>
                }
              />
              <Route
                path="/student/testimonials"
                element={
                  <RequireAuth role="student">
                    <StudentTestimonials />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin/testimonials"
                element={
                  <RequireAuth role="admin">
                    <AdminTestimonials />
                  </RequireAuth>
                }
              />

          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;