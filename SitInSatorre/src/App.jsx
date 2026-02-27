import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from './Pages/LoginPage';
import LayoutNav from "./Components/LayoutNav";
import Landing from "./Pages/Landing";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<LayoutNav />}>
           <Route path="/" element={<Landing />} />
       
        </Route>
      </Routes>
    </Router>
  );
}

export default App;