import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Check, X, Clock, User, FileHeart, FileText, FlaskConical,
  ClipboardCheck, ChevronRight, Loader2, FolderOpen, CalendarCheck,
  AlertTriangle, Stethoscope, PlusCircle, ShieldAlert, Activity, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── helpers ── */
const statusPill = (s) => {
  if (s === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (s === "rejected") return "bg-red-50 text-red-600 border-red-100";
  return "bg-amber-50 text-amber-700 border-amber-200";
};

const SEVERITY = {
  mild:     { label: "Mild",     color: "bg-yellow-50 text-yellow-700 border-yellow-200", dot: "bg-yellow-400" },
  moderate: { label: "Moderate", color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-500" },
  severe:   { label: "Severe",   color: "bg-red-50 text-red-700 border-red-200",          dot: "bg-red-500"    },
  critical: { label: "Critical", color: "bg-rose-900 text-rose-100 border-rose-700",      dot: "bg-rose-400"   },
};

const TYPE_META = {
  prescription:      { label: "Prescription",     icon: FileText,      color: "bg-amber-50 text-amber-700" },
  lab_report:        { label: "Lab Report",        icon: FlaskConical,  color: "bg-emerald-50 text-emerald-700" },
  discharge_summary: { label: "Discharge Summary", icon: ClipboardCheck, color: "bg-violet-50 text-violet-700" },
  doctor_note:       { label: "Doctor Note",       icon: Stethoscope,   color: "bg-blue-50 text-blue-700" },
  other:             { label: "Other",             icon: FileHeart,     color: "bg-gray-50 text-gray-600" },
};

const EMPTY_FORM = { title: "", condition: "", severity: "moderate", notes: "", is_serious: false };

export default function DoctorDashboard() {
  const [appts, setAppts]                   = useState([]);
  const [patients, setPatients]             = useState([]);
  const [searchQuery, setSearchQuery]       = useState("");
  const [selected, setSelected]             = useState(null);
  const [records, setRecords]               = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [panelOpen, setPanelOpen]           = useState(false);
  const [tab, setTab]                       = useState("appointments");
  const [formTab, setFormTab]               = useState("records"); // "records" | "add"
  const [form, setForm]                     = useState(EMPTY_FORM);
  const [saving, setSaving]                 = useState(false);

  const loadAppts   = () => api.get("/appointments").then((r) => setAppts(r.data));
  const loadPatients= () => api.get("/doctor/patients").then((r) => setPatients(r.data)).catch(() => {});

  useEffect(() => { loadAppts(); loadPatients(); }, []);

  const act = async (id, status) => {
    try {
      await api.patch(`/appointments/${id}`, { status });
      toast.success(`Appointment ${status}`);
      loadAppts(); loadPatients();
    } catch { toast.error("Action failed"); }
  };

  const openPanel = async (patient) => {
    setSelected(patient);
    setPanelOpen(true);
    setFormTab("records");
    setForm(EMPTY_FORM);
    await fetchRecords(patient.patient_id);
  };

  const fetchRecords = async (pid) => {
    setRecords([]);
    setRecordsLoading(true);
    try {
      const r = await api.get(`/doctor/patients/${pid}/records`);
      setRecords(r.data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not load records");
      setPanelOpen(false);
    } finally { setRecordsLoading(false); }
  };

  const closePanel = () => { setPanelOpen(false); setSelected(null); setRecords([]); };

  const saveCondition = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.condition.trim()) {
      toast.error("Title and condition are required");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/doctor/patients/${selected.patient_id}/condition`, {
        ...form,
        is_serious: form.is_serious || ["severe", "critical"].includes(form.severity),
      });
      toast.success("Medical condition saved to patient's record");
      setForm(EMPTY_FORM);
      setFormTab("records");
      await fetchRecords(selected.patient_id);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not save");
    } finally { setSaving(false); }
  };

  const pending = appts.filter((a) => a.status === "pending");
  const decided = appts.filter((a) => a.status !== "pending");
  const seriousCount = records.filter((r) => r.is_serious).length;

  const filteredPatients = patients.filter(p => 
    p.patient_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen dark:bg-slate-900" style={{ background: "radial-gradient(ellipse at 15% 10%, rgba(200,90,23,0.07) 0%, transparent 45%), radial-gradient(ellipse at 85% 85%, rgba(79,121,66,0.07) 0%, transparent 45%), var(--bg-fallback, #FAF9F6)" }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-2 text-herb text-xs font-semibold uppercase tracking-widest mb-3">
            <Stethoscope className="w-4 h-4" /> Physician Portal
          </div>
          <h1 className="font-serif text-5xl md:text-6xl text-ink dark:text-slate-100 leading-tight">
            Physician{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron to-orange-500">Dashboard</span>
          </h1>
          <p className="text-ink/55 dark:text-slate-400 mt-3 text-lg">Review appointments, document conditions, access patient records.</p>
        </motion.div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 mt-8 mb-10">
          {[
            { label: "Pending",  value: pending.length,  color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800" },
            { label: "Approved", value: decided.filter(a=>a.status==="approved").length, color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800" },
            { label: "Patients", value: patients.length, color: "text-blue-700 dark:text-blue-400",   bg: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800" },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-3 ${s.bg} border rounded-2xl px-6 py-3`}>
              <span className={`font-serif text-3xl font-bold ${s.color}`}>{s.value}</span>
              <span className="text-sm text-ink/55 dark:text-slate-400 font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-7">
            {[
            { key: "appointments", label: "Appointments", icon: CalendarCheck, iconColor: "text-saffron" },
            { key: "patients",     label: "Patient Records", icon: FileHeart, iconColor: "text-herb" },
          ].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t.key ? "bg-saffron text-white shadow-lg shadow-saffron/25" : "bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 text-ink/55 dark:text-slate-400 hover:border-saffron/40 dark:hover:border-saffron/40 hover:text-ink dark:hover:text-slate-200"
              }`}>
              <t.icon className={`w-4 h-4 ${tab === t.key ? "text-white" : t.iconColor}`} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── Appointments tab ── */}
        {tab === "appointments" && (
          <div className="space-y-10">
            <section>
              <h2 className="font-serif text-2xl text-ink dark:text-slate-100 mb-4">Awaiting approval <span className="text-saffron">({pending.length})</span></h2>
              {pending.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 rounded-3xl p-12 text-center text-ink/45 dark:text-slate-400">
                  <CalendarCheck className="w-10 h-10 mx-auto mb-3 text-herb dark:text-herb-light opacity-50" />
                  <p>All caught up. A calm moment.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pending.map((a) => (
                    <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      data-testid={`pending-${a.id}`}
                      className="bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 hover:shadow-md transition">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-herb-light to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-800/20 flex items-center justify-center border border-emerald-100 dark:border-emerald-800 text-lg font-bold text-herb dark:text-emerald-400">
                          {a.patient_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-serif text-2xl text-ink dark:text-slate-100">{a.patient_name}</div>
                          <div className="text-sm text-ink/50 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3.5 h-3.5" /> {a.date} · {a.time}
                          </div>
                          {a.reason && <p className="text-sm text-ink/65 dark:text-slate-300 mt-2 max-w-md">{a.reason}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => openPanel({ patient_id: a.patient_id, patient_name: a.patient_name })}
                          className="rounded-xl border border-[#E8E1D5] dark:border-slate-700 px-4 py-2.5 text-sm font-medium flex items-center gap-2 text-ink dark:text-slate-200 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition">
                          <Stethoscope className="w-4 h-4" /> Records & Notes
                        </button>
                        <button data-testid={`approve-${a.id}`} onClick={() => act(a.id, "approved")}
                          className="rounded-xl bg-gradient-to-br from-herb to-emerald-600 text-white px-5 py-2.5 font-semibold flex items-center gap-2 shadow-md shadow-herb/25 hover:shadow-lg transition">
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button data-testid={`reject-${a.id}`} onClick={() => act(a.id, "rejected")}
                          className="rounded-xl border border-[#E8E1D5] dark:border-slate-700 px-5 py-2.5 font-semibold flex items-center gap-2 text-ink dark:text-slate-200 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition">
                          <X className="w-4 h-4" /> Decline
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="font-serif text-2xl text-ink dark:text-slate-100 mb-4">Recent decisions</h2>
              {decided.length === 0 ? <p className="text-ink/40 dark:text-slate-500">Nothing here yet.</p> : (
                <div className="grid md:grid-cols-2 gap-4">
                  {decided.map((a) => (
                    <div key={a.id} className="bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 rounded-2xl p-5 flex justify-between items-center hover:shadow-sm transition">
                      <div>
                        <div className="font-serif text-xl text-ink dark:text-slate-100">{a.patient_name}</div>
                        <div className="text-sm text-ink/45 dark:text-slate-400 mt-0.5">{a.date} · {a.time}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openPanel({ patient_id: a.patient_id, patient_name: a.patient_name })}
                          className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 text-ink/35 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition" title="Records & Notes">
                          <Stethoscope className="w-4 h-4" />
                        </button>
                        <span className={`text-xs px-3 py-1.5 rounded-full font-semibold capitalize border ${statusPill(a.status)}`}>{a.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── Patients tab ── */}
        {tab === "patients" && (
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <p className="text-ink/45 dark:text-slate-400 text-sm">Patients who have booked with you. Click to view records or add a medical note.</p>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40 dark:text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search patients..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-white dark:bg-slate-800 text-ink dark:text-slate-200 focus:outline-none focus:border-saffron text-sm w-full sm:w-64"
                />
              </div>
            </div>

            {filteredPatients.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 rounded-3xl p-14 text-center">
                <User className="w-10 h-10 mx-auto mb-3 text-ink/25 dark:text-slate-500" />
                <p className="font-serif text-xl text-ink dark:text-slate-100">
                  {searchQuery ? "No matching patients found." : "No patients yet."}
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filteredPatients.map((p, i) => (
                  <motion.button key={p.patient_id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                    onClick={() => openPanel(p)}
                    className="text-left bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 rounded-2xl p-5 flex items-center gap-4 hover:border-saffron/50 dark:hover:border-saffron/50 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-saffron-light to-herb-light dark:from-saffron/20 dark:to-herb/20 flex items-center justify-center text-base font-bold text-saffron border border-[#E8E1D5] dark:border-slate-700 shrink-0">
                      {p.patient_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif text-xl text-ink dark:text-slate-100 truncate">{p.patient_name}</div>
                      <div className="text-xs text-ink/40 dark:text-slate-500 mt-0.5">View records · Add medical note</div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-ink/25 dark:text-slate-600 group-hover:text-saffron transition-colors shrink-0" />
                  </motion.button>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ══ Slide-over Panel ══ */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closePanel} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" />

            <motion.aside
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 h-full w-full max-w-lg bg-[#FAF9F6] dark:bg-slate-900 border-l border-[#E8E1D5] dark:border-slate-700 z-50 flex flex-col shadow-2xl overflow-hidden">

              {/* Panel header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-[#E8E1D5] dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-saffron to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-saffron/25">
                  {selected?.patient_name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-xl text-ink dark:text-slate-100 truncate">{selected?.patient_name}</div>
                  <div className="text-xs text-ink/45 dark:text-slate-400">Patient Health File</div>
                </div>
                <button onClick={closePanel}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-ink/35 dark:text-slate-400 hover:text-ink dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Serious alert banner */}
              <AnimatePresence>
                {!recordsLoading && seriousCount > 0 && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="bg-red-600 text-white px-6 py-3 flex items-center gap-3 shrink-0">
                    <ShieldAlert className="w-5 h-5 shrink-0 animate-pulse" />
                    <div>
                      <span className="font-bold text-sm">⚠ Serious Alert — </span>
                      <span className="text-sm opacity-90">{seriousCount} record{seriousCount > 1 ? "s" : ""} flagged as serious or critical.</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Inner tabs */}
              <div className="flex gap-2 px-5 pt-4 pb-3 shrink-0 border-b border-[#E8E1D5] dark:border-slate-700 bg-white dark:bg-slate-800">
                {[
                  { key: "records", label: "Health Records", icon: FileHeart },
                  { key: "add",     label: "Add Medical Note", icon: PlusCircle },
                ].map((t) => (
                  <button key={t.key} onClick={() => setFormTab(t.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      formTab === t.key ? "bg-saffron text-white shadow-md shadow-saffron/20" : "bg-gray-50 dark:bg-slate-700 text-ink/55 dark:text-slate-300 hover:text-ink dark:hover:text-white border border-[#E8E1D5] dark:border-slate-600"
                    }`}>
                    <t.icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                ))}
              </div>

              {/* ── Records list ── */}
              {formTab === "records" && (
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {recordsLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 gap-3 text-ink/45 dark:text-slate-500">
                      <Loader2 className="w-7 h-7 animate-spin text-saffron" />
                      <p className="text-sm">Loading records…</p>
                    </div>
                  ) : records.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
                      <FolderOpen className="w-10 h-10 text-ink/20 dark:text-slate-600" />
                      <p className="font-serif text-lg text-ink dark:text-slate-200">No records yet</p>
                      <p className="text-xs text-ink/40 dark:text-slate-500 max-w-xs">Switch to "Add Medical Note" to create the first entry.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-ink/35 dark:text-slate-500 font-semibold uppercase tracking-widest pb-1">
                        {records.length} record{records.length !== 1 ? "s" : ""}
                        {seriousCount > 0 && <span className="ml-2 text-red-500">· {seriousCount} serious</span>}
                      </p>
                      {records.map((rec, i) => {
                        const meta = TYPE_META[rec.record_type] || TYPE_META.other;
                        const Icon = meta.icon;
                        const sev = rec.severity && SEVERITY[rec.severity];
                        return (
                          <motion.div key={rec.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className={`bg-white dark:bg-slate-800 border rounded-2xl p-5 transition hover:shadow-md ${rec.is_serious ? "border-red-300 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-900/50" : "border-[#E8E1D5] dark:border-slate-700"}`}>

                            {/* Serious badge */}
                            {rec.is_serious && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl px-3 py-1.5 mb-3 w-fit">
                                <AlertTriangle className="w-3.5 h-3.5" /> SERIOUS / URGENT
                              </div>
                            )}

                            <div className="flex items-start gap-3 mb-3">
                              <div className={`w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center shrink-0`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] uppercase tracking-widest text-ink/35 dark:text-slate-400 font-bold">{meta.label}</div>
                                <h3 className="font-serif text-lg text-ink dark:text-slate-100 leading-tight truncate mt-0.5">{rec.title}</h3>
                                <div className="text-xs text-ink/45 dark:text-slate-400 mt-0.5">
                                  {rec.date}{rec.doctor_name && ` · ${rec.doctor_name}`}
                                </div>
                              </div>
                              {sev && (
                                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border shrink-0 ${sev.color}`}>{sev.label}</span>
                              )}
                            </div>
                            {rec.notes && (
                              <p className="text-sm text-ink/65 dark:text-slate-300 leading-relaxed bg-[#FAF9F6] dark:bg-slate-900 rounded-xl p-3 border border-[#E8E1D5] dark:border-slate-700 whitespace-pre-wrap">
                                {rec.notes}
                              </p>
                            )}
                            {rec.image_url && (
                              <div className="mt-3 overflow-hidden rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-[#FAF9F6] dark:bg-slate-900">
                                <img src={rec.image_url} alt={rec.title} className="max-h-52 w-full object-cover" />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}

              {/* ── Add Medical Note form ── */}
              {formTab === "add" && (
                <form onSubmit={saveCondition} className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex gap-3 text-blue-800 dark:text-blue-300 text-sm">
                    <Activity className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>This note will be saved directly to <strong>{selected?.patient_name}</strong>'s health records and visible to them.</p>
                  </div>

                  {/* Diagnosis title */}
                  <div>
                    <label className="text-xs font-semibold text-ink/50 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Diagnosis / Title *</label>
                    <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Hypertension Stage 1"
                      className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-white dark:bg-slate-800 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron text-sm transition" />
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="text-xs font-semibold text-ink/50 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Medical Condition *</label>
                    <textarea required rows={3} value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}
                      placeholder="Describe the patient's medical condition in detail…"
                      className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-white dark:bg-slate-800 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron text-sm transition resize-none" />
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="text-xs font-semibold text-ink/50 dark:text-slate-400 uppercase tracking-wider block mb-2">Severity Level</label>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(SEVERITY).map(([key, val]) => (
                        <button key={key} type="button" onClick={() => setForm({ ...form, severity: key, is_serious: ["severe","critical"].includes(key) })}
                          className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-xs font-semibold transition-all ${
                            form.severity === key ? `${val.color} shadow-md scale-105` : "border-[#E8E1D5] dark:border-slate-700 bg-white dark:bg-slate-800 text-ink/50 dark:text-slate-400 hover:border-gray-300 dark:hover:border-slate-500"
                          }`}>
                          <span className={`w-3 h-3 rounded-full ${val.dot}`} />
                          {val.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Doctor notes */}
                  <div>
                    <label className="text-xs font-semibold text-ink/50 dark:text-slate-400 uppercase tracking-wider block mb-1.5">Doctor's Notes (optional)</label>
                    <textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="Recommendations, medications, follow-up instructions…"
                      className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-white dark:bg-slate-800 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron text-sm transition resize-none" />
                  </div>

                  {/* Serious flag */}
                  <label className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition">
                    <input type="checkbox" checked={form.is_serious || ["severe","critical"].includes(form.severity)}
                      onChange={(e) => setForm({ ...form, is_serious: e.target.checked })}
                      className="w-4 h-4 accent-red-600" />
                    <div>
                      <div className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" /> Flag as Serious / Urgent
                      </div>
                      <div className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">Patient will see a red alert on this record</div>
                    </div>
                  </label>

                  <button type="submit" disabled={saving}
                    className="w-full saffron-btn rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                    {saving ? "Saving…" : "Save to Patient Record"}
                  </button>
                </form>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
