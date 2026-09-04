import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Leaf, Loader2 } from "lucide-react";

export default function Login() {
  const { login, loginDemo } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
                placeholder="you@vediccare.app"
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

          <div className="my-6 flex items-center gap-3 text-xs text-ink/50">
            <div className="leaf-divider flex-1" /> or <div className="leaf-divider flex-1" />
          </div>

          <button data-testid="login-demo" onClick={demo} disabled={loading} className="w-full rounded-full border border-[#E8E1D5] py-3.5 font-medium hover:border-saffron hover:bg-saffron-light/30 transition">
            Continue as demo user
          </button>

          <p className="text-sm text-ink/60 mt-6 text-center">
            New here? <Link to="/register" className="text-saffron font-medium" data-testid="login-goregister">Create an account</Link>
          </p>
        </div>

        <p className="text-xs text-ink/40 text-center mt-6">
          Made with care, not diagnosis. Consult a doctor for serious concerns.
        </p>
      </div>
    </div>
  );
}
