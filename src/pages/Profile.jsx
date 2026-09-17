import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { User, Lock, Save, Shield, BadgeCheck, FileText } from "lucide-react";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [nameForm, setNameForm] = useState({ name: user?.name || "" });
  const [pwForm, setPwForm] = useState({ password: "", confirm: "" });
  const [abhaForm, setAbhaForm] = useState({ abha_id: user?.abha_id || "" });
  const [medRegForm, setMedRegForm] = useState({ medical_registration_number: user?.medical_registration_number || "" });
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [savingGov, setSavingGov] = useState(false);

  const saveName = async (e) => {
    e.preventDefault();
    if (!nameForm.name.trim()) return toast.error("Name cannot be empty");
    setSavingName(true);
    try {
      const res = await api.patch("/auth/me", { name: nameForm.name.trim() });
      if (setUser) setUser((prev) => ({ ...prev, name: res.data.name }));
      const stored = JSON.parse(localStorage.getItem("vediccare_user") || "{}");
      localStorage.setItem("vediccare_user", JSON.stringify({ ...stored, name: res.data.name }));
      toast.success("Name updated!");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const savePw = async (e) => {
    e.preventDefault();
    if (pwForm.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (pwForm.password !== pwForm.confirm) return toast.error("Passwords do not match");
    setSavingPw(true);
    try {
      await api.patch("/auth/me", { password: pwForm.password });
      toast.success("Password updated!");
      setPwForm({ password: "", confirm: "" });
    } catch {
      toast.error("Failed to update password");
    } finally {
      setSavingPw(false);
    }
  };

  const saveGovId = async (e, type) => {
    e.preventDefault();
    setSavingGov(true);
    try {
      const payload = type === "abha" ? { abha_id: abhaForm.abha_id } : { medical_registration_number: medRegForm.medical_registration_number };
      const res = await api.patch("/auth/me", payload);
      if (setUser) setUser((prev) => ({ ...prev, ...payload }));
      const stored = JSON.parse(localStorage.getItem("vediccare_user") || "{}");
      localStorage.setItem("vediccare_user", JSON.stringify({ ...stored, ...payload }));
      toast.success(type === "abha" ? "ABHA ID Linked Successfully!" : "Medical Registration Submitted!");
    } catch {
      toast.error("Failed to save government ID");
    } finally {
      setSavingGov(false);
    }
  };

  return (
    <div className="min-h-screen motif-bg">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-ink mb-1">Profile & Settings</h1>
          <p className="text-ink/60">Manage your account details and verification</p>
        </div>

        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#EEF3EA] flex items-center justify-center text-2xl font-bold text-herb border border-herb/20">
            {user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-ink text-lg">{user?.name}</p>
            <p className="text-ink/60 text-sm">{user?.email}</p>
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              user?.role === "doctor" ? "bg-herb-light text-herb" :
              user?.role === "admin" ? "bg-[#ECE8F5] text-[#7560A8]" :
              "bg-saffron-light text-saffron"
            }`}>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</span>
          </div>
        </div>

        {/* Government Identity (ABHA / HPR) */}
        {user?.role === "patient" && (
          <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 mb-6 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-saffron/5 rounded-bl-full -z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-saffron-light flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4 text-saffron" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-ink flex items-center gap-2">
                    Ayushman Bharat (ABHA) 
                    {user?.abha_id && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-sans tracking-wide uppercase font-bold">Verified</span>}
                  </h2>
                  <p className="text-xs text-ink/50">Link your national health ID for seamless records</p>
                </div>
              </div>
              <form onSubmit={(e) => saveGovId(e, "abha")} className="flex gap-3">
                <input
                  value={abhaForm.abha_id}
                  onChange={(e) => setAbhaForm({ abha_id: e.target.value })}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron font-mono text-sm"
                  placeholder="e.g. 14-XXXX-XXXX-XXXX"
                />
                <button type="submit" disabled={savingGov} className="saffron-btn px-5 py-3 rounded-xl font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  {savingGov ? "Linking..." : (user?.abha_id ? "Update ABHA" : "Link ABHA")}
                </button>
              </form>
            </div>
          </div>
        )}

        {user?.role === "doctor" && (
          <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 mb-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-herb/5 rounded-bl-full -z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-herb-light flex items-center justify-center">
                  <FileText className="w-4 h-4 text-herb" />
                </div>
                <div>
                  <h2 className="font-serif text-xl text-ink flex items-center gap-2">
                    Medical Registration (HPR)
                    {user?.medical_registration_number && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-sans tracking-wide uppercase font-bold">Pending Approval</span>}
                  </h2>
                  <p className="text-xs text-ink/50">Required for platform verification</p>
                </div>
              </div>
              <form onSubmit={(e) => saveGovId(e, "medical")} className="flex gap-3">
                <input
                  value={medRegForm.medical_registration_number}
                  onChange={(e) => setMedRegForm({ medical_registration_number: e.target.value })}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-herb/30 focus:border-herb font-mono text-sm"
                  placeholder="Registration Number"
                />
                <button type="submit" disabled={savingGov} className="bg-herb text-white hover:bg-herb-hover px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all">
                  <Shield className="w-4 h-4" />
                  {savingGov ? "Saving..." : (user?.medical_registration_number ? "Update Reg No." : "Submit")}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Name */}
        <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <h2 className="font-serif text-xl text-ink">Display Name</h2>
          </div>
          <form onSubmit={saveName} className="flex gap-3">
            <input
              value={nameForm.name}
              onChange={(e) => setNameForm({ name: e.target.value })}
              className="flex-1 px-4 py-3 rounded-xl border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron"
              placeholder="Your full name"
            />
            <button type="submit" disabled={savingName} className="bg-gray-800 text-white hover:bg-gray-700 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition">
              <Save className="w-4 h-4" />
              {savingName ? "Saving..." : "Save"}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-[#ECE8F5] flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#7560A8]" />
            </div>
            <h2 className="font-serif text-xl text-ink">Change Password</h2>
          </div>
          <form onSubmit={savePw} className="space-y-4">
            <input
              type="password"
              value={pwForm.password}
              onChange={(e) => setPwForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="New password (min 6 characters)"
              className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron"
            />
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="Confirm new password"
              className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron"
            />
            <button type="submit" disabled={savingPw} className="bg-gray-800 text-white hover:bg-gray-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition">
              <Lock className="w-4 h-4" />
              {savingPw ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
