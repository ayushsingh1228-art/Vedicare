import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ShieldCheck, Users, UserCheck, Stethoscope, Activity, CheckCircle2, XCircle } from "lucide-react";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ total_users: 0, total_patients: 0, total_doctors: 0, verified_users: 0, pending_users: 0, total_logins: 0 });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const load = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([api.get("/admin/stats"), api.get("/admin/users")]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not load admin dashboard");
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => { if (user?.role === "admin") load(); }, [user]);

  const toggleVerification = async (targetUserId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${targetUserId}/verify`, { is_verified: !currentStatus });
      toast.success(currentStatus ? "User unverified" : "User verified");
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not update user verification");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-ink/60">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  const cards = [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "bg-saffron-light text-saffron" },
    { label: "Patients", value: stats.total_patients, icon: Users, color: "bg-emerald-50 text-emerald-700" },
    { label: "Doctors", value: stats.total_doctors, icon: Stethoscope, color: "bg-blue-50 text-blue-700" },
    { label: "Total Logins", value: stats.total_logins, icon: Activity, color: "bg-violet-50 text-violet-700" },
  ];

  return (
    <div className="min-h-screen motif-bg">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-[#E8E1D5] rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-herb">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal
            </div>
            <h1 className="font-serif text-5xl text-ink mt-4">Admin dashboard</h1>
          </div>
          <div className="bg-white border border-[#E8E1D5] rounded-2xl px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-ink/40">Verified</div>
            <div className="font-serif text-3xl text-ink">{stats.verified_users}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white border border-[#E8E1D5] rounded-3xl p-5 shadow-sm">
              <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="mt-4 text-ink/55 text-sm">{label}</div>
              <div className="font-serif text-4xl text-ink mt-1">{value}</div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#E8E1D5] rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-3xl text-ink">User verification</h2>
              <p className="text-ink/60 mt-1">Only admins approve patient and doctor access.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 text-amber-700 px-3 py-1.5 text-sm font-medium">
              <UserCheck className="w-4 h-4" />
              Pending: {stats.pending_users}
            </div>
          </div>

          {loadingUsers ? (
            <div className="text-ink/60">Loading users…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-[#E8E1D5] text-sm uppercase tracking-[0.18em] text-ink/40">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id} className="border-b border-[#F1EAE2] align-middle">
                      <td className="py-4 pr-4 font-medium text-ink">{item.name}</td>
                      <td className="py-4 pr-4 text-ink/70 capitalize">{item.role}</td>
                      <td className="py-4 pr-4 text-ink/70">{item.email}</td>
                      <td className="py-4 pr-4">
                        {item.is_verified ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-700 px-2.5 py-1 text-xs font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4 text-right">
                        {item.role !== "admin" && (
                          <button
                            onClick={() => toggleVerification(item.id, !!item.is_verified)}
                            className={`rounded-full px-4 py-2 text-sm font-medium ${item.is_verified ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-herb-light text-herb hover:bg-herb/20"}`}
                          >
                            {item.is_verified ? "Unverify" : "Verify"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
