import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Leaf, Loader2, Phone, ArrowLeft } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const { login, loginDemo, googleLogin, sendOtp, phoneLogin } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Phone OTP state
  const [phoneStep, setPhoneStep] = useState(null); // null | "enter_phone" | "enter_otp"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}`);
      if (u.role === "admin") nav("/admin");
      else if (u.role === "doctor") nav("/doctor");
      else nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  const demo = async () => {
    setLoading(true);
    try {
      await loginDemo();
      toast.success("Demo mode ready");
      nav("/dashboard");
    } catch { toast.error("Demo unavailable"); }
    finally { setLoading(false); }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const u = await googleLogin(credentialResponse.credential);
      toast.success(`Welcome, ${u.name}! 🌿`);
      if (u.role === "admin") nav("/admin");
      else if (u.role === "doctor") nav("/doctor");
      else nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Google sign-in failed");
    }
  };

  const handleSendOtp = async () => {
    const cleaned = phone.trim().replace(/\s/g, "");
    if (!cleaned || cleaned.length < 10) return toast.error("Enter a valid phone number");
    const formatted = cleaned.startsWith("+") ? cleaned : `+91${cleaned}`;
    setPhoneLoading(true);
    try {
      const res = await sendOtp(formatted);
      setPhone(formatted);
      setDemoOtp(res.demo_otp || "");
      setPhoneStep("enter_otp");
      toast.success("OTP sent! Check below (demo mode).");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to send OTP");
    } finally { setPhoneLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) return toast.error("Enter the 6-digit OTP");
    setPhoneLoading(true);
    try {
      const u = await phoneLogin(phone, otp);
      toast.success(`Welcome, ${u.name}! 🌿`);
      nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid OTP");
    } finally { setPhoneLoading(false); }
  };

  return (
    <div className="min-h-screen motif-bg flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 justify-center mb-10">
          <div className="w-11 h-11 rounded-full bg-saffron flex items-center justify-center">
            <Leaf className="w-5 h-5 text-ivory" />
          </div>
          <span className="font-serif text-3xl text-ink">Vediccare</span>
        </Link>

        <div className="bg-white border border-[#E8E1D5] rounded-3xl p-10">
          <h1 className="font-serif text-4xl text-ink">Welcome back.</h1>
          <p className="text-ink/60 mt-2">Continue your wellness ritual.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm text-ink/70 font-medium">Email</label>
              <input
                data-testid="login-email"
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1.5 px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron transition"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm text-ink/70 font-medium">Password</label>
              <input
                data-testid="login-password"
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1.5 px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron transition"
                placeholder="••••••••"
              />
            </div>
            <button data-testid="login-submit" disabled={loading} type="submit" className="w-full saffron-btn rounded-full py-3.5 font-medium flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Sign in
            </button>
          </form>

          {/* Social / Alternative Login */}
          <div className="mt-6">
            <div className="flex items-center gap-3 text-xs text-ink/40 mb-4">
              <div className="flex-1 h-px bg-[#E8E1D5]" />
              <span>or continue with</span>
              <div className="flex-1 h-px bg-[#E8E1D5]" />
            </div>

            {/* Phone OTP inline flow */}
            {!phoneStep ? (
              <div className="grid grid-cols-2 gap-3">
                {/* Google */}
                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => toast.error("Google sign-in failed. Try again.")}
                    shape="pill"
                    size="medium"
                    text="signin_with"
                    theme="outline"
                  />
                </div>
                {/* Phone OTP trigger */}
                <button
                  type="button"
                  onClick={() => setPhoneStep("enter_phone")}
                  className="flex items-center justify-center gap-2.5 border border-[#E8E1D5] rounded-full py-2.5 px-4 text-sm font-medium text-ink/70 hover:border-saffron hover:bg-saffron-light/20 transition-all"
                >
                  <Phone className="w-4 h-4 text-saffron" />
                  Phone OTP
                </button>
              </div>
            ) : phoneStep === "enter_phone" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setPhoneStep(null)} className="text-ink/40 hover:text-ink transition">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-medium text-ink/70">Enter your mobile number</p>
                </div>
                <div className="flex gap-2">
                  <span className="flex items-center px-3 py-3 rounded-xl border border-[#E8E1D5] bg-gray-50 text-sm text-ink/60 font-medium">🇮🇳 +91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit mobile number"
                    className="flex-1 px-4 py-3 rounded-xl border border-[#E8E1D5] focus:outline-none focus:border-saffron transition text-sm"
                  />
                </div>
                <button
                  onClick={handleSendOtp}
                  disabled={phoneLoading}
                  className="w-full saffron-btn rounded-full py-3 text-sm font-medium flex items-center justify-center gap-2"
                >
                  {phoneLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Send OTP
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setPhoneStep("enter_phone")} className="text-ink/40 hover:text-ink transition">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-medium text-ink/70">Enter the OTP sent to {phone}</p>
                </div>
                {demoOtp && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                    <p className="text-xs text-amber-700 font-medium">Demo OTP (SMS integration pending)</p>
                    <p className="text-2xl font-bold text-amber-800 tracking-widest mt-1">{demoOtp}</p>
                  </div>
                )}
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit OTP"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] focus:outline-none focus:border-saffron transition text-center text-xl font-bold tracking-widest"
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={phoneLoading}
                  className="w-full saffron-btn rounded-full py-3 text-sm font-medium flex items-center justify-center gap-2"
                >
                  {phoneLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Verify & Sign In
                </button>
              </div>
            )}
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-ink/40">
            <div className="flex-1 h-px bg-[#E8E1D5]" />
            <span>or</span>
            <div className="flex-1 h-px bg-[#E8E1D5]" />
          </div>

          <button data-testid="login-demo" onClick={demo} disabled={loading} className="w-full rounded-full border border-[#E8E1D5] py-3 font-medium text-sm text-ink/60 hover:border-saffron hover:bg-saffron-light/30 transition">
            Continue as demo user
          </button>

          <p className="text-sm text-ink/60 mt-6 text-center">
            New here? <Link to="/register" className="text-saffron font-medium" data-testid="login-goregister">Create an account</Link>
          </p>
          <p className="text-sm text-ink/60 mt-2 text-center">
            <Link to="/forgot-password" className="text-saffron/80 hover:text-saffron">Forgot your password?</Link>
          </p>
        </div>

        <p className="text-xs text-ink/40 text-center mt-6">
          Made with care, not diagnosis. Consult a doctor for serious concerns.
        </p>
      </div>
    </div>
  );
}
