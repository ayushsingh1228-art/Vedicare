import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Leaf, Loader2 } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const { login, loginDemo, googleLogin } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(Welcome back, );
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
      toast.success(Welcome, ! 🌿);
      if (u.role === "admin") nav("/admin");
      else if (u.role === "doctor") nav("/doctor");
      else nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Google sign-in failed");
    }
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

          <div className="mt-6">
            <div className="flex items-center gap-3 text-xs text-ink/40 mb-4">
              <div className="flex-1 h-px bg-[#E8E1D5]" />
              <span>or continue with</span>
              <div className="flex-1 h-px bg-[#E8E1D5]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
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
              <button
                type="button"
                onClick={() => toast.info("GitHub login is coming soon! Use Google or email for now.")}
                className="flex items-center justify-center gap-2.5 border border-[#E8E1D5] rounded-full py-2.5 px-4 text-sm font-medium text-ink/70 hover:border-ink/30 hover:bg-gray-50 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                GitHub
              </button>
            </div>
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
