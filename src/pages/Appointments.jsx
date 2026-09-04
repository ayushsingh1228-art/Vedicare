import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Stethoscope, Loader2, Check, X, Clock } from "lucide-react";
import { format } from "date-fns";

const TIMES = ["09:00", "10:30", "12:00", "15:00", "16:30", "18:00"];

const statusPill = (s) => {
  if (s === "approved") return "bg-herb-light text-herb";
  if (s === "rejected") return "bg-red-100 text-red-700";
  return "bg-saffron-light text-saffron";
};

export default function Appointments() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState("");
  const [reason, setReason] = useState("");
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const [d, a] = await Promise.all([api.get("/doctors"), api.get("/appointments")]);
    setDoctors(d.data.filter(x => x.role === "doctor"));
    setAppts(a.data);
  };

  useEffect(() => { load(); }, []);

  const book = async () => {
    if (!selectedDoc || !time) { toast.error("Pick a doctor and time"); return; }
    setLoading(true);
    try {
      await api.post("/appointments", {
        doctor_id: selectedDoc.id,
        date: format(date, "yyyy-MM-dd"),
        time,
        reason,
      });
      toast.success("Appointment requested. The doctor will confirm shortly.");
      setSelectedDoc(null); setTime(""); setReason("");
      load();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Booking failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <div className="max-w-2xl">
          <div className="text-[11px] uppercase tracking-[0.18em] text-[#7A6C60]">Care planning</div>
          <h1 className="font-serif text-5xl md:text-6xl leading-none text-ink mt-3">Book an appointment</h1>
        </div>
        <p className="text-ink/60 mt-2">Meet a physician on your rhythm.</p>

        <div className="grid lg:grid-cols-[0.85fr_1.15fr] gap-6 mt-10">
          {/* Doctors */}
          <section className="bg-white border border-[#E7DED0] rounded-[28px] p-6 md:p-7">
            <h2 className="font-serif text-2xl mb-4 text-ink">Choose your doctor</h2>
            <div className="space-y-3">
              {doctors.map((d) => (
                <button key={d.id} data-testid={`doctor-${d.id}`} onClick={() => setSelectedDoc(d)}
                  className={`w-full text-left flex gap-4 items-center p-4 rounded-2xl border transition ${selectedDoc?.id === d.id ? 'border-saffron bg-saffron-light/40' : 'border-[#E8E1D5] hover:border-saffron/60'}`}>
                  <div className="w-12 h-12 rounded-full bg-herb-light flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-herb" />
                  </div>
                  <div className="flex-1">
                    <div className="font-serif text-xl text-ink">{d.name}</div>
                    <div className="text-sm text-ink/60">{d.specialization}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Calendar + slots */}
          <section className="bg-[#1D1A17] text-[#F7F3EE] rounded-[28px] p-6 md:p-7">
            <h2 className="font-serif text-2xl mb-4 text-white">Pick date & time</h2>
            <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} disabled={{ before: new Date() }} className="rounded-2xl border border-white/10 p-3 bg-[#2A241F] text-[#F7F3EE]" />
            <div className="mt-6">
              <div className="text-sm text-[#D0C4B5] mb-2">Available slots on {format(date, "PPP")}</div>
              <div className="flex flex-wrap gap-2">
                {TIMES.map((t) => (
                  <button key={t} data-testid={`slot-${t}`} onClick={() => setTime(t)}
                    className={`px-4 py-2 rounded-full text-sm transition ${time === t ? 'bg-saffron text-white' : 'bg-ivory text-ink border border-[#E8E1D5] hover:border-saffron'}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <textarea data-testid="appt-reason" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Brief reason (optional)" rows={3}
              className="mt-6 w-full px-4 py-3 rounded-xl border border-[#E8E1D5] bg-ivory focus:outline-none focus:border-saffron" />
            <button data-testid="appt-book" onClick={book} disabled={loading} className="mt-4 w-full saffron-btn rounded-full py-3.5 font-medium flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />} Request appointment
            </button>
          </section>
        </div>

        {/* My appointments */}
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-ink mb-6">Your appointments</h2>
          {appts.length === 0 ? (
            <div className="bg-white border border-[#E8E1D5] rounded-3xl p-10 text-center text-ink/60">
              No appointments yet. Book one above.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appts.map((a) => (
                <div key={a.id} data-testid={`appt-${a.id}`} className="bg-white border border-[#E8E1D5] rounded-2xl p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-serif text-xl text-ink">{a.doctor_name}</div>
                      <div className="text-sm text-ink/60 flex items-center gap-1 mt-1">
                        <Clock className="w-3.5 h-3.5" /> {a.date} · {a.time}
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium capitalize ${statusPill(a.status)}`}>{a.status}</span>
                  </div>
                  {a.reason && <p className="text-sm text-ink/70 mt-3">{a.reason}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
