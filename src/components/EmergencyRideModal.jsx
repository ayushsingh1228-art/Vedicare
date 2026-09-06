import { useState, useEffect, useRef } from "react";
import { X, MapPin, Phone, Car, Bike, Ambulance, CheckCircle2, Navigation, Star } from "lucide-react";

const HOSPITALS = [
  { name: "AyurVaid Ayurvedic Hospital", address: "Sector 18, Noida", dist: "2.3 km", phone: "tel:+911204567890", specialty: "Panchakarma & Rejuvenation" },
  { name: "National Institute of Ayurveda", address: "Jorawar Singh Gate, Jaipur", dist: "3.8 km", phone: "tel:+911412635816", specialty: "Govt. Ayurvedic Research & OPD" },
  { name: "Patanjali Wellness Center", address: "Haridwar Bypass Road", dist: "5.1 km", phone: "tel:+911334240008", specialty: "Yoga & Herbal Treatments" },
  { name: "Dr. Aarav Sharma Ayurveda Clinic", address: "Lajpat Nagar, New Delhi", dist: "1.6 km", phone: "tel:+919810112233", specialty: "Dosha Balancing & Detox" },
  { name: "Kottakkal Arya Vaidya Sala", address: "Connaught Place, New Delhi", dist: "4.0 km", phone: "tel:+919312456789", specialty: "Classical Kerala Ayurveda" },
];

const VEHICLES = [
  { id: "rapido", label: "Rapido Medical Bike", icon: Bike, eta: 5, price: "49", desc: "Fastest in traffic · 1 Passenger", bg: "bg-yellow-400", border: "border-yellow-400" },
  { id: "uber", label: "Uber Emergency Go", icon: Car, eta: 9, price: "99", desc: "Safe & Affordable · AC Cab", bg: "bg-black", border: "border-black" },
  { id: "ambulance", label: "Vedic Express Ambulance", icon: Ambulance, eta: 12, price: "499", desc: "Paramedic + O₂ Support · 24/7", bg: "bg-red-500", border: "border-red-500" },
];

const DRIVERS = [
  { name: "Ramesh K.", rating: 4.9, plate: "DL 3C AX 7842", phone: "tel:+919876543210" },
  { name: "Sunil Verma", rating: 4.7, plate: "UP 16 BT 4521", phone: "tel:+919812345678" },
  { name: "Amit Singh", rating: 4.8, plate: "HR 26 CX 9103", phone: "tel:+919988776655" },
];

export default function EmergencyRideModal({ open, onClose }) {
  const [step, setStep] = useState("select_hospital");
  const [hospital, setHospital] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [driver, setDriver] = useState(null);
  const [eta, setEta] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setStep("select_hospital"); setHospital(null); setVehicle(null);
      setDriver(null); setEta(null); clearInterval(timerRef.current);
    }
  }, [open]);

  const confirmRide = () => {
    const v = VEHICLES.find((x) => x.id === vehicle);
    setDriver(DRIVERS[Math.floor(Math.random() * DRIVERS.length)]);
    setEta(v.eta);
    setStep("dispatching");
    setTimeout(() => {
      setStep("en_route");
      let seconds = v.eta * 60;
      timerRef.current = setInterval(() => {
        seconds -= 3;
        setEta(Math.max(0, Math.ceil(seconds / 60)));
        if (seconds <= 0) { clearInterval(timerRef.current); setStep("arrived"); }
      }, 1500);
    }, 2500);
  };

  if (!open) return null;
  const selV = VEHICLES.find((x) => x.id === vehicle);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-5 rounded-t-3xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">🚨</div>
            <div>
              <h2 className="text-white font-bold text-lg leading-none">Emergency Transport</h2>
              <p className="text-red-100 text-xs mt-0.5">Reach your doctor fast — stay in Vediccare</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {step === "select_hospital" && (
            <>
              <p className="text-xs uppercase tracking-widest text-ink/40">Nearby Ayurvedic Clinics</p>
              {HOSPITALS.map((h) => (
                <button key={h.name} onClick={() => { setHospital(h); setStep("select_vehicle"); }}
                  className="w-full text-left p-4 rounded-2xl border border-[#E8E1D5] hover:border-saffron hover:bg-saffron-light/10 transition">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-saffron-light rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-saffron" />
                    </div>
                    <div>
                      <div className="font-semibold text-ink text-sm">{h.name}</div>
                      <div className="text-xs text-ink/50">{h.specialty}</div>
                      <div className="text-xs text-herb font-medium mt-0.5">{h.dist} · {h.address}</div>
                    </div>
                  </div>
                </button>
              ))}
              <a href="tel:108" className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-red-50 text-red-600 font-semibold border border-red-200 hover:bg-red-100 transition text-sm">
                <Phone className="w-4 h-4" /> Call 108 — National Ambulance
              </a>
            </>
          )}

          {step === "select_vehicle" && hospital && (
            <>
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-2xl border border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-green-700">{hospital.name}</div>
                  <div className="text-xs text-green-600">{hospital.dist}</div>
                </div>
              </div>
              <p className="text-xs uppercase tracking-widest text-ink/40">Choose your ride</p>
              {VEHICLES.map((v) => {
                const VIcon = v.icon;
                const sel = vehicle === v.id;
                return (
                  <button key={v.id} onClick={() => setVehicle(v.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition ${sel ? v.border + " bg-gray-50" : "border-[#E8E1D5]"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${v.bg} flex items-center justify-center`}><VIcon className="w-5 h-5 text-white" /></div>
                      <div className="flex-1">
                        <div className="font-semibold text-ink text-sm">{v.label}</div>
                        <div className="text-xs text-ink/50">{v.desc}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-ink">₹{v.price}</div>
                        <div className="text-xs text-herb">{v.eta} min</div>
                      </div>
                    </div>
                  </button>
                );
              })}
              <div className="flex gap-3">
                <button onClick={() => setStep("select_hospital")} className="flex-1 py-3 rounded-2xl border border-[#E8E1D5] text-ink/60 text-sm">Back</button>
                <button onClick={confirmRide} disabled={!vehicle} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-semibold hover:bg-red-600 transition disabled:opacity-40 text-sm">
                  Dispatch Ride 🚀
                </button>
              </div>
            </>
          )}

          {step === "dispatching" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto animate-pulse text-4xl">
                {vehicle === "rapido" ? "🛵" : vehicle === "uber" ? "🚗" : "🚑"}
              </div>
              <h3 className="font-serif text-2xl text-ink mt-4">Finding your driver…</h3>
              <div className="mt-4 flex justify-center gap-1">
                {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-saffron animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
              </div>
            </div>
          )}

          {(step === "en_route" || step === "arrived") && driver && selV && (
            <>
              <div className={`p-4 rounded-2xl text-center font-semibold text-sm ${step === "arrived" ? "bg-green-100 text-green-700" : "bg-saffron-light text-saffron"}`}>
                {step === "arrived" ? "✅ Driver has Arrived! Head downstairs." : `🚗 Driver is on the way — ${eta} min away`}
              </div>
              {step === "en_route" && (
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 bg-saffron rounded-full transition-all duration-1000" style={{ width: `${Math.max(10, 100 - (eta / selV.eta) * 100)}%` }} />
                </div>
              )}
              <div className="bg-[#F7F3EE] rounded-2xl p-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-saffron to-orange-400 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                  {driver.name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-ink">{driver.name}</div>
                  <div className="flex items-center gap-1 text-sm mt-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-ink/70">{driver.rating} · {driver.plate}</span>
                  </div>
                </div>
                <a href={driver.phone} className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center hover:bg-green-600 transition">
                  <Phone className="w-4 h-4" />
                </a>
              </div>
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                <Navigation className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="flex-1">
                  <div className="text-xs text-blue-500 font-medium">Heading to</div>
                  <div className="font-semibold text-ink text-sm">{hospital?.name}</div>
                  <div className="text-xs text-ink/50">{hospital?.address}</div>
                </div>
                <a href={hospital?.phone} className="text-blue-600"><Phone className="w-4 h-4" /></a>
              </div>
              <div className="space-y-2">
                {["Ride confirmed","Driver dispatched","Driver en route","Driver arrived"].map((s, i) => {
                  const done = step === "arrived" ? true : i < 3;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${done ? "bg-herb" : "bg-gray-200"}`}>
                        {done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className={`text-sm ${done ? "text-ink font-medium" : "text-ink/40"}`}>{s}</span>
                    </div>
                  );
                })}
              </div>
              {step === "arrived" && (
                <button onClick={onClose} className="w-full py-3 rounded-2xl bg-herb text-white font-semibold hover:bg-herb/90 transition">Done — Get well soon! 🙏</button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
