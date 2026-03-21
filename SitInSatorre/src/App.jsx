import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from './Pages/LoginPage';
import LayoutNav from "./Components/LayoutNav";
import Landing from "./Pages/Landing";
import SignUp from "./Pages/SignUp";
import Dashboard from "./Student/Dashboard";
import StudentProfile from "./Student/StudentProfile";
import AdminOverview from "./Admin/AdminOverview";
import SearchStudent from "./Admin/SearchStudent";
import CurrentSessions from "./Admin/CurrentSessions";
import SitInRecords from "./Admin/SitInRecords";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUp />} />
        <Route element={<LayoutNav />}>
           <Route path="/" element={<Landing />} /> 
            <Route path="/admin/dashboard" element={<AdminOverview />} />
            <Route path="/admin/search-student" element={<SearchStudent />} />
            <Route path="/admin/current-sessions" element={<CurrentSessions />} />
            <Route path="/admin/sit-in-records" element={<SitInRecords />} />
           <Route path="/student/dashboard" element={<Dashboard />} />
           <Route path="/student/profile" element={<StudentProfile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;