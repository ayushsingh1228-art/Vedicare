import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Plus, Trash2, Mail, Check, Pill } from "lucide-react";

export default function Medicines() {
  const [meds, setMeds] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", dosage: "", times: "08:00, 20:00", start_date: new Date().toISOString().slice(0, 10), end_date: "", notes: "" });
  const today = new Date().toISOString().slice(0, 10);

  const load = () => api.get("/medicines").then((r) => setMeds(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    const times = form.times.split(",").map((t) => t.trim()).filter(Boolean);
    if (times.length === 0) return toast.error("Add at least one time");
    if (form.end_date && form.end_date < form.start_date) {
      return toast.error("End date cannot be before start date");
    }
    try {
      await api.post("/medicines", { ...form, times, end_date: form.end_date || null });
      toast.success("Medicine added");
      setOpen(false);
      setForm({ name: "", dosage: "", times: "08:00, 20:00", start_date: new Date().toISOString().slice(0, 10), end_date: "", notes: "" });
      load();
    } catch { toast.error("Could not save"); }
  };

  const markTaken = async (med, time) => {
    await api.post(`/medicines/${med.id}/taken`, { date: today, time });
    toast.success(`Marked ${med.name} at ${time}`);
    load();
  };

  const sendEmail = async (med) => {
    const r = await api.post(`/medicines/${med.id}/email-reminder`);
    if (r.data.status === "sent") toast.success(`Email reminder sent for ${med.name}`);
    else toast.error("Email failed to send");
  };

  const del = async (id) => {
    if (!window.confirm("Remove this medicine?")) return;
    await api.delete(`/medicines/${id}`);
    load();
  };

  const isTaken = (med, time) => (med.taken_log || []).some((l) => l.date === today && l.time === time);

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#7A6C60]">Daily care</div>
            <h1 className="font-serif text-5xl md:text-6xl leading-none text-ink mt-3">Medicine reminders</h1>
            <p className="text-ink/60 mt-2">Gentle nudges in-app and to your inbox.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button data-testid="med-add" className="saffron-btn rounded-full px-6 py-3 font-medium flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add medicine
              </button>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-3xl border border-[#E8E1D5]">
              <DialogHeader>
                <DialogTitle className="font-serif text-3xl text-ink">Add medicine</DialogTitle>
              </DialogHeader>
              <form onSubmit={create} className="space-y-4 mt-2">
                <input data-testid="med-name" required placeholder="Name (e.g. Ashwagandha)" className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <input data-testid="med-dosage" required placeholder="Dosage (e.g. 1 tablet after meals)" className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
                <input data-testid="med-times" required placeholder="Times, comma separated (e.g. 08:00, 20:00)" className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron" value={form.times} onChange={(e) => setForm({ ...form, times: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-ink/60">Start</label>
                    <input data-testid="med-start" type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron" />
                  </div>
                  <div>
                    <label className="text-xs text-ink/60">End (optional)</label>
                    <input data-testid="med-end" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                      className="w-full mt-1 px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron" />
                  </div>
                </div>
                <textarea data-testid="med-notes" placeholder="Notes (optional)" rows={2} className="w-full px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                <button data-testid="med-save" type="submit" className="w-full saffron-btn rounded-full py-3 font-medium">Save</button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {meds.length === 0 ? (
          <div className="bg-white border border-[#E7DED0] rounded-[28px] p-16 text-center">
            <Bell className="w-14 h-14 mx-auto text-saffron mb-4" />
            <p className="font-serif text-2xl text-ink">No medicines yet.</p>
            <p className="text-ink/60 mt-2">Add one to start gentle reminders.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {meds.map((m) => (
              <div key={m.id} data-testid={`med-${m.id}`} className="bg-white border border-[#E7DED0] rounded-[26px] p-6 hover:shadow-[0_18px_35px_-26px_rgba(38,28,18,0.35)] transition-shadow">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-saffron-light flex items-center justify-center">
                      <Pill className="w-6 h-6 text-saffron" />
                    </div>
                    <div>
                      <h3 className="font-serif text-2xl text-ink">{m.name}</h3>
                      <p className="text-ink/60 text-sm">{m.dosage}</p>
                      <p className="text-ink/50 text-xs mt-1">From {m.start_date}{m.end_date && ` → ${m.end_date}`}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button data-testid={`med-email-${m.id}`} onClick={() => sendEmail(m)} className="rounded-full border border-[#E8E1D5] px-4 py-2 text-sm flex items-center gap-2 hover:border-saffron transition">
                      <Mail className="w-4 h-4" /> Email me
                    </button>
                    <button data-testid={`med-del-${m.id}`} onClick={() => del(m.id)} className="p-2 rounded-full hover:bg-red-50 text-ink/40 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {m.times.map((t) => {
                    const taken = isTaken(m, t);
                    return (
                      <button key={t} data-testid={`med-time-${m.id}-${t}`} onClick={() => !taken && markTaken(m, t)} disabled={taken}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center gap-2 ${taken ? 'bg-herb-light text-herb line-through' : 'bg-saffron-light text-saffron hover:bg-saffron hover:text-ivory'}`}>
                        {taken && <Check className="w-3.5 h-3.5" />} {t}
                      </button>
                    );
                  })}
                </div>
                {m.notes && <p className="text-sm text-ink/60 mt-4 italic">"{m.notes}"</p>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
