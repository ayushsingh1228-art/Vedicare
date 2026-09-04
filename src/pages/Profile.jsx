import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { User, Lock, Leaf, Save, Shield } from "lucide-react";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [nameForm, setNameForm] = useState({ name: user?.name || "" });
  const [pwForm, setPwForm] = useState({ password: "", confirm: "" });
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveName = async (e) => {
    e.preventDefault();
    if (!nameForm.name.trim()) return toast.error("Name cannot be empty");
    setSavingName(true);
    try {
      const res = await api.patch("/auth/me", { name: nameForm.name.trim() });
      if (setUser) setUser((prev) => ({ ...prev, name: res.data.name }));
      // Update localStorage
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

  return (
    <div className="min-h-screen motif-bg">
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-4xl text-ink mb-1">Profile & Settings</h1>
          <p className="text-ink/60">Manage your account details</p>
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

        {/* Name */}
        <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-saffron-light flex items-center justify-center">
              <User className="w-4 h-4 text-saffron" />
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
            <button type="submit" disabled={savingName} className="saffron-btn px-5 py-3 rounded-xl font-semibold flex items-center gap-2">
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
            <button type="submit" disabled={savingPw} className="saffron-btn px-6 py-3 rounded-xl font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {savingPw ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Account info */}
        <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#E5F0E2] flex items-center justify-center">
              <Shield className="w-4 h-4 text-herb" />
            </div>
            <h2 className="font-serif text-xl text-ink">Account Info</h2>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">Email</span>
              <span className="text-ink font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Role</span>
              <span className="text-ink font-medium capitalize">{user?.role}</span>
            </div>
            {user?.specialization && (
              <div className="flex justify-between">
                <span className="text-ink/60">Specialization</span>
                <span className="text-ink font-medium">{user.specialization}</span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
