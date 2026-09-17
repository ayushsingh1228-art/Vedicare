import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("vediccare_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem("vediccare_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const r = await api.post("/auth/login", { email, password });
    localStorage.setItem("vediccare_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const register = async (payload) => {
    const r = await api.post("/auth/register", payload);
    localStorage.setItem("vediccare_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  const loginDemo = async () => {
    const r = await api.post("/auth/demo");
    localStorage.setItem("vediccare_token", r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };

  // Google OAuth Sign-In
  const googleLogin = async (googleCredential) => {
    const r = await api.post("/auth/google", { credential: googleCredential });
    localStorage.setItem("vediccare_token", r.data.token);
    localStorage.setItem("vediccare_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  // Phone OTP — Step 1: request OTP
  const sendOtp = async (phone) => {
    const r = await api.post("/auth/send-otp", { phone });
    return r.data; // includes demo_otp for hackathon demo
  };

  // Phone OTP — Step 2: verify OTP and log in
  const phoneLogin = async (phone, otp, name) => {
    const r = await api.post("/auth/verify-otp", { phone, otp, name });
    localStorage.setItem("vediccare_token", r.data.token);
    localStorage.setItem("vediccare_user", JSON.stringify(r.data.user));
    setUser(r.data.user);
    return r.data.user;
  };

  const logout = () => {
    localStorage.removeItem("vediccare_token");
    localStorage.removeItem("vediccare_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, loginDemo, googleLogin, sendOtp, phoneLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
