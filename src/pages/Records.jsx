import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileHeart, Trash2, Plus, FileText, FlaskConical, ClipboardCheck, Stethoscope, Download, Edit2, X } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const TYPE_META = {
  prescription: { label: "Prescription", icon: FileText, color: "bg-saffron-light text-saffron" },
  lab_report: { label: "Lab Report", icon: FlaskConical, color: "bg-herb-light text-herb" },
  discharge_summary: { label: "Discharge Summary", icon: ClipboardCheck, color: "bg-cream text-ink" },
  doctor_note: { label: "Doctor Note", icon: Stethoscope, color: "bg-blue-50 text-blue-700" },
  other: { label: "Other", icon: FileHeart, color: "bg-cream text-ink" },
};

export default function Records() {
  const [records, setRecords] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", record_type: "prescription", date: new Date().toISOString().slice(0, 10), notes: "", doctor_name: "", image_url: "" });
  
  const [lightboxImg, setLightboxImg] = useState(null);
  const reportRef = useRef(null);

  const load = () => api.get("/records").then((r) => setRecords(r.data));
  useEffect(() => { load(); }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setForm((prev) => ({ ...prev, image_url: result }));
    };
    reader.readAsDataURL(file);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ title: "", record_type: "prescription", date: new Date().toISOString().slice(0, 10), notes: "", doctor_name: "", image_url: "" });
    setOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({
      title: record.title,
      record_type: record.record_type,
      date: record.date,
      notes: record.notes || "",
      doctor_name: record.doctor_name || "",
      image_url: record.image_url || ""
    });
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
    } catch (err) {
      toast.error("Failed to generate PDF", { id: "pdf-toast" });
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE] dark:bg-slate-900">
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#7A6C60] dark:text-slate-400">Your archive</div>
            <h1 className="font-serif text-5xl md:text-6xl leading-none text-ink dark:text-slate-100 mt-3">Health records</h1>
            <p className="text-ink/60 dark:text-slate-400 mt-2">Everything you carry — safely in one place.</p>
          </div>
          <div className="flex gap-3">
            {records.length > 0 && (
              <button onClick={exportPDF} className="bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 text-ink dark:text-slate-200 rounded-full px-5 py-3 font-medium flex items-center gap-2 hover:bg-ivory dark:hover:bg-slate-700 transition">
                <Download className="w-4 h-4" /> Export PDF
              </button>
            )}
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
                  <input data-testid="record-title" required placeholder="Title (e.g. Blood test July)"
                    className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-ivory dark:bg-slate-900 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron"
                    value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <select data-testid="record-type" value={form.record_type} onChange={(e) => setForm({ ...form, record_type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-ivory dark:bg-slate-900 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron">
                    {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <input data-testid="record-date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-ivory dark:bg-slate-900 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron" />
                  <input data-testid="record-doctor" placeholder="Doctor name (optional)"
                    className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-ivory dark:bg-slate-900 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron"
                    value={form.doctor_name} onChange={(e) => setForm({ ...form, doctor_name: e.target.value })} />
                  <textarea data-testid="record-notes" placeholder="Notes / diagnosis / medications" rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-ivory dark:bg-slate-900 text-ink dark:text-slate-100 focus:outline-none focus:border-saffron"
                    value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-ink/70 dark:text-slate-400">Report photo (optional)</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="block w-full text-sm text-ink/70 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-saffron-light file:text-saffron file:font-medium"
                      />
                      {form.image_url && (
                        <button type="button" onClick={() => setForm((prev) => ({ ...prev, image_url: "" }))}
                          className="text-sm text-red-600 hover:text-red-700">Remove</button>
                      )}
                    </div>
                    {form.image_url && (
                      <img src={form.image_url} alt="Report preview" className="h-32 w-full rounded-xl object-cover border border-[#E8E1D5] dark:border-slate-700" />
                    )}
                  </div>

                  <button data-testid="record-save" type="submit" className="w-full saffron-btn rounded-full py-3 font-medium">
                    {editingId ? "Update record" : "Save record"}
                  </button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {records.length === 0 ? (
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
                    <div className={`w-12 h-12 rounded-2xl ${meta.color} flex items-center justify-center`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)} className="p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30 text-ink/40 dark:text-slate-500 hover:text-blue-600 transition">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button data-testid={`record-delete-${r.id}`} onClick={() => del(r.id)} className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 text-ink/40 dark:text-slate-500 hover:text-red-600 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-xs uppercase tracking-widest text-ink/50 dark:text-slate-400">{meta.label}</div>
                    <h3 className="font-serif text-2xl text-ink dark:text-slate-100 mt-1">{r.title}</h3>
                    <div className="text-sm text-ink/60 dark:text-slate-400 mt-1">{r.date} {r.doctor_name && `· ${r.doctor_name}`}</div>
                    {r.notes && <p className="text-sm text-ink/70 dark:text-slate-300 mt-3 line-clamp-4">{r.notes}</p>}
                    {r.image_url && (
                      <img 
                        src={r.image_url} 
                        alt={r.title} 
                        onClick={() => setLightboxImg(r.image_url)}
                        className="mt-4 h-40 w-full rounded-2xl object-cover border border-[#E8E1D5] dark:border-slate-700 cursor-zoom-in hover:opacity-90 transition" 
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setLightboxImg(null)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightboxImg(null)} className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2">
              <X className="w-8 h-8" />
            </button>
            <img src={lightboxImg} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" alt="Full screen report" />
            <a 
              href={lightboxImg} 
              download="Vediccare_Report.png" 
              className="mt-4 bg-white text-ink px-6 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-gray-100"
            >
              <Download className="w-4 h-4" /> Download Image
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
