import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import Chatbot from "@/pages/Chatbot";
import Appointments from "@/pages/Appointments";
import Records from "@/pages/Records";
import Wellness from "@/pages/Wellness";
import Medicines from "@/pages/Medicines";
import Profile from "@/pages/Profile";
import DoshaQuiz from "@/pages/DoshaQuiz";
import DoctorDashboard from "@/pages/DoctorDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

function Protected({ children, doctor, admin }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-ink/60">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (doctor && user.role !== "doctor") return <Navigate to="/dashboard" replace />;
  if (admin && user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Toaster position="top-right" richColors />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              <Route path="/chatbot" element={<Protected><Chatbot /></Protected>} />
              <Route path="/appointments" element={<Protected><Appointments /></Protected>} />
              <Route path="/records" element={<Protected><Records /></Protected>} />
              <Route path="/wellness" element={<Protected><Wellness /></Protected>} />
              <Route path="/medicines" element={<Protected><Medicines /></Protected>} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="/dosha-quiz" element={<Protected><DoshaQuiz /></Protected>} />
              <Route path="/doctor" element={<Protected doctor><DoctorDashboard /></Protected>} />
              <Route path="/admin" element={<Protected admin><AdminDashboard /></Protected>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

