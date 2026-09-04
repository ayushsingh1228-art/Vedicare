import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Leaf, Loader2 } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "patient", specialization: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await register(form);
      toast.success(`Welcome, ${u.name}`);
      if (u.role === "doctor") nav("/doctor");
      else nav("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
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
          <h1 className="font-serif text-4xl text-ink">Create your account.</h1>
          <p className="text-ink/60 mt-2">A gentle start to lifelong wellness.</p>

          <div className="mt-6 grid grid-cols-2 gap-2 p-1 bg-cream rounded-full">
            {["patient", "doctor"].map((r) => (
              <button key={r} data-testid={`register-role-${r}`} onClick={() => setForm({ ...form, role: r })}
                className={`py-2 rounded-full text-sm font-medium transition ${form.role === r ? 'bg-saffron text-ivory' : 'text-ink/70'}`}>
                {r === "patient" ? "I'm a Patient" : "I'm a Doctor"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-ink/70 font-medium">Full name</label>
              <input data-testid="register-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full mt-1.5 px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron" placeholder="Your name" />
            </div>
            <div>
              <label className="text-sm text-ink/70 font-medium">Email</label>
              <input data-testid="register-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full mt-1.5 px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron" placeholder="you@vediccare.app" />
            </div>
            <div>
              <label className="text-sm text-ink/70 font-medium">Password</label>
              <input data-testid="register-password" type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full mt-1.5 px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron" placeholder="At least 6 characters" />
            </div>
            {form.role === "doctor" && (
              <div>
                <label className="text-sm text-ink/70 font-medium">Specialization</label>
                <input data-testid="register-specialization" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="w-full mt-1.5 px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron" placeholder="e.g. Ayurvedic Medicine" />
              </div>
            )}

            <button data-testid="register-submit" disabled={loading} type="submit" className="w-full saffron-btn rounded-full py-3.5 font-medium flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Create account
            </button>
          </form>

          <p className="text-sm text-ink/60 mt-6 text-center">
            Already here? <Link to="/login" className="text-saffron font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
