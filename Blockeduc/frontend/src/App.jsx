import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./auth/Login";
import StudentDashboard from "./dashboards/student/StudentDashboard";
import ProfessorDashboard from "./dashboards/professor/ProfessorDashboard";
import AdminDashboard from "./dashboards/admin/AdminDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/professor" element={<ProfessorDashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
