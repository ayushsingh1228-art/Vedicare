import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { ShieldCheck, Users, UserCheck, Stethoscope, Activity, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#22c55e', '#eab308', '#ef4444'];

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const [stats, setStats] = useState({ total_users: 0, total_patients: 0, total_doctors: 0, verified_users: 0, pending_users: 0, total_logins: 0 });
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const load = async () => {
    try {
      const [statsRes, usersRes, analyticsRes] = await Promise.all([
        api.get("/admin/stats"), 
        api.get("/admin/users"),
        api.get("/admin/analytics")
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setAnalytics(analyticsRes.data);
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
    <div className="min-h-screen motif-bg dark:bg-slate-900">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-herb">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin Portal
            </div>
            <h1 className="font-serif text-5xl text-ink dark:text-slate-100 mt-4">Admin dashboard</h1>
          </div>
          <div className="bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 rounded-2xl px-4 py-3 text-right">
            <div className="text-xs uppercase tracking-[0.2em] text-ink/40 dark:text-slate-400">Verified</div>
            <div className="font-serif text-3xl text-ink dark:text-slate-100">{stats.verified_users}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 rounded-3xl p-5 shadow-sm">
              <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="mt-4 text-ink/55 dark:text-slate-400 text-sm">{label}</div>
              <div className="font-serif text-4xl text-ink dark:text-slate-100 mt-1">{value}</div>
            </div>
          ))}
        </div>

        {analytics && (
          <div className="grid md:grid-cols-2 gap-5 mb-10">
            <div className="bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 rounded-3xl p-6 shadow-sm">
              <h3 className="font-serif text-2xl text-ink dark:text-slate-100 mb-6">Appointments (Last 7 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.appointments_by_day}>
                    <XAxis dataKey="day" stroke="#8884d8" />
                    <YAxis allowDecimals={false} stroke="#8884d8" />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 rounded-3xl p-6 shadow-sm">
              <h3 className="font-serif text-2xl text-ink dark:text-slate-100 mb-6">Appointment Status</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.appointment_status} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                      {analytics.appointment_status.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {analytics.appointment_status.map((entry, index) => (
                    <div key={entry.status} className="flex items-center gap-2 text-sm text-ink/70 dark:text-slate-300">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      {entry.status}: {entry.count}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-serif text-3xl text-ink dark:text-slate-100">User verification</h2>
              <p className="text-ink/60 dark:text-slate-400 mt-1">Only admins approve patient and doctor access.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 text-sm font-medium">
              <UserCheck className="w-4 h-4" />
              Pending: {stats.pending_users}
            </div>
          </div>

          {loadingUsers ? (
            <div className="text-ink/60 dark:text-slate-400">Loading users…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-[#E8E1D5] dark:border-slate-700 text-sm uppercase tracking-[0.18em] text-ink/40 dark:text-slate-500">
                    <th className="py-3 pr-4">Name</th>
                    <th className="py-3 pr-4">Role</th>
                    <th className="py-3 pr-4">Email</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id} className="border-b border-[#F1EAE2] dark:border-slate-700/50 align-middle">
                      <td className="py-4 pr-4 font-medium text-ink dark:text-slate-200">{item.name}</td>
                      <td className="py-4 pr-4 text-ink/70 dark:text-slate-400 capitalize">{item.role}</td>
                      <td className="py-4 pr-4 text-ink/70 dark:text-slate-400">{item.email}</td>
                      <td className="py-4 pr-4">
                        {item.is_verified ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 text-xs font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-4 pr-4 text-right">
                        {item.role !== "admin" && (
                          <button
                            onClick={() => toggleVerification(item.id, !!item.is_verified)}
                            className={`rounded-full px-4 py-2 text-sm font-medium ${item.is_verified ? "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50" : "bg-herb-light dark:bg-herb/20 text-herb dark:text-herb-light hover:bg-herb/30"}`}
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
