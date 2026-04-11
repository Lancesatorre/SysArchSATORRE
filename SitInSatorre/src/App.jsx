import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from './Pages/LoginPage';
import LayoutNav from "./Components/LayoutNav";
import Landing from "./Pages/Landing";
import SignUp from "./Pages/SignUp";
import Dashboard from "./Student/Dashboard";
import StudentProfile from "./Student/StudentProfile";
import StudentHistory from "./Student/StudentHistory";
import AdminOverview from "./Admin/AdminOverview";
import SearchStudent from "./Admin/SearchStudent";
import CurrentSessions from "./Admin/CurrentSessions";
import SitInRecords from "./Admin/SitInRecords";
import { authService } from "./services/authService";

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
    <Router>
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
           <Route path="/" element={<Landing />} /> 
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;