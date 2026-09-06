import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileHeart, Trash2, Plus, FileText, FlaskConical, ClipboardCheck, Stethoscope, Download, Edit2, X, TestTube2, Home, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const TYPE_META = {
  prescription: { label: "Prescription", icon: FileText, color: "bg-saffron-light text-saffron" },
  lab_report: { label: "Lab Report", icon: FlaskConical, color: "bg-herb-light text-herb" },
  discharge_summary: { label: "Discharge Summary", icon: ClipboardCheck, color: "bg-cream text-ink" },
  doctor_note: { label: "Doctor Note", icon: Stethoscope, color: "bg-blue-50 text-blue-700" },
  other: { label: "Other", icon: FileHeart, color: "bg-cream text-ink" },
};

const LAB_TESTS = [
  { name: "Complete Blood Count (CBC) & ESR", partner: "Dr. Lal PathLabs", price: 299, desc: "Comprehensive blood cell analysis & inflammation markers", turnaround: "Same Day", icon: "🩸" },
  { name: "Ayurvedic Prakriti & Ama Toxin Profile", partner: "Tata 1mg Labs", price: 499, desc: "Identify your dominant dosha & metabolic toxin levels", turnaround: "48 hrs", icon: "🌿" },
  { name: "Lipid Profile + Liver Function (LFT)", partner: "Apollo Diagnostics", price: 649, desc: "Cholesterol, triglycerides, and liver enzyme screening", turnaround: "Same Day", icon: "🫀" },
  { name: "Diabetes HbA1c + Fasting Blood Sugar", partner: "Thyrocare", price: 399, desc: "Long-term blood sugar control and glucose screening", turnaround: "Same Day", icon: "💉" },
  { name: "Thyroid Profile Total (T3, T4, TSH)", partner: "Dr. Lal PathLabs", price: 449, desc: "Complete thyroid hormone check for metabolism & mood", turnaround: "Same Day", icon: "🦋" },
  { name: "Vitamin D3 + B12 Combo", partner: "Tata 1mg Labs", price: 749, desc: "Essential vitamins for immunity, bones, & energy", turnaround: "48 hrs", icon: "☀️" },
];

export default function Records() {
  const [records, setRecords] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", record_type: "prescription", date: new Date().toISOString().slice(0, 10), notes: "", doctor_name: "", image_url: "" });
  const [lightboxImg, setLightboxImg] = useState(null);
  const reportRef = useRef(null);
  const [activeTab, setActiveTab] = useState("records");
  const [labBooking, setLabBooking] = useState(null);
  const [labForm, setLabForm] = useState({ date: new Date().toISOString().slice(0, 10), time: "07:00", address: "" });
  const [labBooked, setLabBooked] = useState(false);

  const load = () => api.get("/records").then((r) => setRecords(r.data));
  useEffect(() => { load(); }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file"); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, image_url: String(reader.result || "") }));
    reader.readAsDataURL(file);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ title: "", record_type: "prescription", date: new Date().toISOString().slice(0, 10), notes: "", doctor_name: "", image_url: "" });
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({ title: record.title, record_type: record.record_type, date: record.date, notes: record.notes || "", doctor_name: record.doctor_name || "", image_url: record.image_url || "" });
    setOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.patch(`/records/${editingId}`, { ...form, image_url: form.image_url || null });
        toast.success("Record updated");
      } else {
        await api.post("/records", { ...form, image_url: form.image_url || null });
        toast.success("Record saved");
      }
      setOpen(false);
      load();
    } catch { toast.error("Could not save"); }
  };

  const del = async (id) => {
    if (!window.confirm("Delete this record?")) return;
    await api.delete(`/records/${id}`);
    toast.success("Deleted");
    load();
  };

  const exportPDF = async () => {
    if (!reportRef.current) return;
    try {
      toast.info("Generating PDF...", { id: "pdf-toast" });
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("Vediccare_Health_Records.pdf");
      toast.success("PDF Downloaded", { id: "pdf-toast" });
    } catch { toast.error("Failed to generate PDF", { id: "pdf-toast" }); }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE] dark:bg-slate-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#7A6C60] dark:text-slate-400">Your archive</div>
            <h1 className="font-serif text-5xl md:text-6xl leading-none text-ink dark:text-slate-100 mt-3">Health records</h1>
            <p className="text-ink/60 dark:text-slate-400 mt-2">Everything you carry — safely in one place.</p>
          </div>
          <div className="flex gap-3">
            {records.length > 0 && activeTab === "records" && (
              <button onClick={exportPDF} className="bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 text-ink dark:text-slate-200 rounded-full px-5 py-3 font-medium flex items-center gap-2 hover:bg-ivory transition">
                <Download className="w-4 h-4" /> Export PDF
              </button>
            )}
            {activeTab === "records" && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <button data-testid="record-add" onClick={openNew} className="saffron-btn rounded-full px-6 py-3 font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add record
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-slate-800 rounded-3xl border border-[#E8E1D5] dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-3xl text-ink dark:text-slate-100">{editingId ? "Edit record" : "New health record"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={save} className="space-y-4 mt-2">
                    <input data-testid="record-title" required placeholder="Title (e.g. Blood test July)" className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-ivory dark:bg-slate-900 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    <select data-testid="record-type" value={form.record_type} onChange={(e) => setForm({ ...form, record_type: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-ivory dark:bg-slate-900 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron">
                      {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <input data-testid="record-date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-ivory dark:bg-slate-900 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron" />
                    <input data-testid="record-doctor" placeholder="Doctor name (optional)" className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-ivory dark:bg-slate-900 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron" value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} />
                    <textarea data-testid="record-notes" placeholder="Notes / diagnosis / medications" rows={4} className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-ivory dark:bg-slate-900 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-ink/70 dark:text-slate-400">Report photo (optional)</label>
                      <div className="flex items-center gap-3">
                        <input type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="block w-full text-sm text-ink/70 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-saffron-light file:text-saffron file:font-medium" />
                        {form.image_url && <button type="button" onClick={() => setForm((prev) => ({ ...prev, image_url: "" }))} className="text-sm text-red-600 hover:text-red-700">Remove</button>}
                      </div>
                      {form.image_url && <img src={form.image_url} alt="Report preview" className="h-32 w-full rounded-xl object-cover border border-[#E8E1D5] dark:border-slate-700" />}
                    </div>
                    <button data-testid="record-save" type="submit" className="w-full saffron-btn rounded-full py-3 font-medium">{editingId ? "Update record" : "Save record"}</button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Tab Nav */}
        <div className="flex gap-2 mb-8 bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 rounded-2xl p-1.5 w-fit">
          <button onClick={() => setActiveTab("records")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "records" ? "bg-saffron text-white shadow-md" : "text-ink/60 hover:text-ink"}`}>
            <FileHeart className="w-4 h-4" /> My Records
          </button>
          <button onClick={() => setActiveTab("labs")} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === "labs" ? "bg-herb text-white shadow-md" : "text-ink/60 hover:text-ink"}`}>
            <TestTube2 className="w-4 h-4" /> Diagnostic Lab Tests
          </button>
        </div>

        {/* Records Tab */}
        {activeTab === "records" && (
          records.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 border border-[#E7DED0] dark:border-slate-700 rounded-[28px] p-16 text-center">
              <FileHeart className="w-14 h-14 mx-auto text-herb dark:text-herb-light mb-4" />
              <p className="font-serif text-2xl text-ink dark:text-slate-100">No records yet.</p>
              <p className="text-ink/60 dark:text-slate-400 mt-2">Add your first prescription or lab report.</p>
            </div>
          ) : (
            <div ref={reportRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 dark:bg-slate-900 p-2 -m-2 rounded-xl">
              {records.map((r) => {
                const meta = TYPE_META[r.record_type] || TYPE_META.other;
                const Icon = meta.icon;
                return (
                  <div key={r.id} data-testid={`record-${r.id}`} className="bg-white dark:bg-slate-800 border border-[#E7DED0] dark:border-slate-700 rounded-[26px] p-6 hover:-translate-y-0.5 hover:shadow-[0_18px_35px_-26px_rgba(38,28,18,0.35)] transition-all">
                    <div className="flex items-start justify-between">
                      <div className={`w-12 h-12 rounded-2xl ${meta.color} flex items-center justify-center`}><Icon className="w-6 h-6" /></div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(r)} className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-ink/40 dark:text-slate-500 hover:text-blue-600 transition"><Edit2 className="w-4 h-4" /></button>
                        <button data-testid={`record-delete-${r.id}`} onClick={() => del(r.id)} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-ink/40 dark:text-slate-500 hover:text-red-600 transition"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs uppercase tracking-widest text-ink/50 dark:text-slate-400">{meta.label}</div>
                      <h3 className="font-serif text-2xl text-ink dark:text-slate-100 mt-1">{r.title}</h3>
                      <div className="text-sm text-ink/60 dark:text-slate-400 mt-1">{r.date} {r.doctor_name && `· ${r.doctor_name}`}</div>
                      {r.notes && <p className="text-sm text-ink/70 dark:text-slate-300 mt-3 line-clamp-4">{r.notes}</p>}
                      {r.image_url && <img src={r.image_url} alt={r.title} onClick={() => setLightboxImg(r.image_url)} className="mt-4 h-40 w-full rounded-2xl object-cover border border-[#E8E1D5] dark:border-slate-700 cursor-zoom-in hover:opacity-90 transition" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Lab Tests Tab */}
        {activeTab === "labs" && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {[["🔴 Dr. Lal PathLabs","bg-red-50 border-red-200 text-red-700"],["💙 Tata 1mg Labs","bg-blue-50 border-blue-200 text-blue-700"],["🟣 Apollo Diagnostics","bg-purple-50 border-purple-200 text-purple-700"],["🟢 Thyrocare","bg-green-50 border-green-200 text-green-700"]].map(([name, cls]) => (
                <div key={name} className={`text-xs font-semibold px-3 py-1.5 rounded-xl border ${cls}`}>{name}</div>
              ))}
            </div>
            <div className="flex items-center gap-2 p-3 bg-herb-light/40 border border-herb/20 rounded-2xl text-sm text-herb">
              <Home className="w-4 h-4 shrink-0" />
              <span><strong>Free home sample collection</strong> available 6 AM – 10 AM · Fasting required for some tests</span>
            </div>
            {LAB_TESTS.map((test) => (
              <div key={test.name} className="bg-white border border-[#E7DED0] rounded-[26px] p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-herb-light rounded-2xl flex items-center justify-center text-2xl shrink-0">{test.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-xl text-ink">{test.name}</h3>
                    <p className="text-xs text-herb font-semibold mt-0.5">{test.partner}</p>
                    <p className="text-sm text-ink/60 mt-1">{test.desc}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs bg-saffron-light text-saffron px-2 py-1 rounded-lg font-medium">⏱ {test.turnaround}</span>
                      <span className="text-xs bg-herb-light text-herb px-2 py-1 rounded-lg font-medium">🏠 Home Collection</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-2xl text-ink">₹{test.price}</div>
                    <button onClick={() => { setLabBooking(test); setLabBooked(false); }} className="mt-2 saffron-btn rounded-xl px-4 py-2 text-sm font-medium">Book Now</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Lab Booking Modal */}
      {labBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setLabBooking(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            {labBooked ? (
              <div className="text-center py-6">
                <div className="text-5xl mb-3">✅</div>
                <h3 className="font-serif text-2xl text-ink">Booking Confirmed!</h3>
                <p className="text-ink/60 text-sm mt-2">A phlebotomist from <strong>{labBooking.partner}</strong> will visit on <strong>{labForm.date}</strong> at <strong>{labForm.time}</strong>.</p>
                <p className="text-xs text-ink/40 mt-2">Sample ID: LAB-{Math.floor(Math.random()*900000+100000)}</p>
                <button onClick={() => setLabBooking(null)} className="mt-4 w-full saffron-btn rounded-2xl py-3 font-semibold">Done</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl text-ink">Book Home Sample Collection</h3>
                  <button onClick={() => setLabBooking(null)}><X className="w-5 h-5 text-ink/40" /></button>
                </div>
                <div className="p-3 bg-herb-light/40 rounded-2xl">
                  <div className="text-sm font-semibold text-ink">{labBooking.name}</div>
                  <div className="text-xs text-herb">{labBooking.partner} · ₹{labBooking.price}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-ink/60">Collection Date</label>
                    <input type="date" value={labForm.date} min={new Date().toISOString().slice(0,10)} onChange={(e) => setLabForm({...labForm, date: e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E8E1D5] text-sm focus:outline-none focus:border-herb" />
                  </div>
                  <div>
                    <label className="text-xs text-ink/60">Time Slot</label>
                    <select value={labForm.time} onChange={(e) => setLabForm({...labForm, time: e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E8E1D5] text-sm focus:outline-none focus:border-herb">
                      <option value="06:00">6:00 AM (Fasting)</option>
                      <option value="07:00">7:00 AM (Fasting)</option>
                      <option value="08:00">8:00 AM</option>
                      <option value="09:00">9:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-ink/60">Home Address</label>
                  <textarea rows={2} placeholder="Enter your full home address for sample pickup" value={labForm.address} onChange={(e) => setLabForm({...labForm, address: e.target.value})} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-[#E8E1D5] text-sm focus:outline-none focus:border-herb" />
                </div>
                <div className="flex items-center gap-2 text-xs text-ink/50 bg-gray-50 rounded-xl p-3">
                  <CheckCircle2 className="w-4 h-4 text-herb shrink-0" /> Reports will be emailed within {labBooking.turnaround} · Free report download
                </div>
                <button onClick={() => { if (!labForm.address.trim()) { alert("Please enter your address"); return; } setLabBooked(true); }} className="w-full bg-herb text-white rounded-2xl py-3 font-semibold hover:bg-herb/90 transition flex items-center justify-center gap-2">
                  <Home className="w-4 h-4" /> Confirm Home Collection — ₹{labBooking.price}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setLightboxImg(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightboxImg(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2"><X className="w-8 h-8" /></button>
            <img src={lightboxImg} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" alt="Full screen report" />
            <a href={lightboxImg} download="Vediccare_Report.png" className="mt-4 bg-white text-ink px-6 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-gray-100"><Download className="w-4 h-4" /> Download Image</a>
          </div>
        </div>
      )}
    </div>
  );
}
