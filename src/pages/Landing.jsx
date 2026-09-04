import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { motion } from "framer-motion";
import { Leaf, MessagesSquare, CalendarCheck, FileHeart, Bell, ArrowRight, Sparkles, Languages, ShieldCheck, Star, Zap, Receipt } from "lucide-react";

const features = [
  {
    icon: MessagesSquare,
    title: "AI Wellness Chat",
    desc: "Ask anything from doshas to daily habits — and now billing & invoice questions too. Warm, grounded answers rooted in Ayurveda + modern care.",
    color: "from-orange-50 to-amber-50",
    iconBg: "bg-gradient-to-br from-saffron to-orange-400",
    tag: "AI Powered",
  },
  {
    icon: CalendarCheck,
    title: "Appointment Booking",
    desc: "Browse trusted physicians and book slots. Doctors approve in a tap. Get reminders before your visit.",
    color: "from-emerald-50 to-green-50",
    iconBg: "bg-gradient-to-br from-herb to-emerald-500",
    tag: "3 Specialists",
  },
  {
    icon: FileHeart,
    title: "Health Records",
    desc: "Prescriptions, lab reports, discharge summaries — all safely organised and always accessible.",
    color: "from-rose-50 to-pink-50",
    iconBg: "bg-gradient-to-br from-rose-500 to-pink-500",
    tag: "Encrypted",
  },
  {
    icon: Bell,
    title: "Medicine Reminders",
    desc: "Timely nudges in-app and to your inbox so no dose is missed. Track what you've taken today.",
    color: "from-violet-50 to-purple-50",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-500",
    tag: "Smart Alerts",
  },
];

const featureIconColors = [
  "bg-[#F9E7D8] text-saffron",
  "bg-[#E5F0E2] text-herb",
  "bg-[#F4E4E8] text-[#A34A5E]",
  "bg-[#ECE8F5] text-[#7560A8]",
];

const hindiFeatures = [
  { icon: MessagesSquare, title: "एआई स्वास्थ्य चैट", desc: "दोष, दिनचर्या, स्वास्थ्य और बिलिंग से जुड़े सवाल पूछें। आयुर्वेद और आधुनिक देखभाल से प्रेरित सरल जवाब पाएं।", color: "from-orange-50 to-amber-50", iconBg: "bg-gradient-to-br from-saffron to-orange-400" },
  { icon: CalendarCheck, title: "अपॉइंटमेंट बुक करें", desc: "विश्वसनीय डॉक्टर खोजें, समय चुनें और अपनी अपॉइंटमेंट आसानी से बुक करें।", color: "from-emerald-50 to-green-50", iconBg: "bg-gradient-to-br from-herb to-emerald-500" },
  { icon: FileHeart, title: "स्वास्थ्य रिकॉर्ड", desc: "प्रिस्क्रिप्शन, जांच रिपोर्ट और डिस्चार्ज सारांश एक सुरक्षित जगह पर रखें।", color: "from-rose-50 to-pink-50", iconBg: "bg-gradient-to-br from-rose-500 to-pink-500" },
  { icon: Bell, title: "दवा की याद दिलाएं", desc: "समय पर रिमाइंडर पाएं ताकि आपकी कोई भी खुराक न छूटे।", color: "from-violet-50 to-purple-50", iconBg: "bg-gradient-to-br from-violet-500 to-purple-500" },
];

const testimonials = [
  { name: "Priya Sharma", role: "Patient since 2025", text: "The AI chat even helped me understand my hospital bill. I didn't know I was overcharged until I asked!", stars: 5 },
  { name: "Rahul Mehta", role: "Panchakarma patient", text: "Booking Dr. Aarav was so easy, and the medicine reminders keep me on track every day.", stars: 5 },
  { name: "Anita Iyer", role: "Wellness member", text: "Finally an app that blends Ayurveda with modern health tools. The dosha tips are spot on.", stars: 5 },
];

const trustBadges = [
  { icon: ShieldCheck, label: "HIPAA Safe" },
  { icon: Zap, label: "Instant Access" },
  { icon: Receipt, label: "Billing Help" },
  { icon: Star, label: "4.9 Rated" },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function Landing() {
  const { isHindi: showHindi, toggleLanguage } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F7F3EE] overflow-x-hidden">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#F7F3EE]/90 border-b border-[#E7DED0]/80">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5" data-testid="landing-logo">
            <div className="w-10 h-10 rounded-xl bg-[#C85A17] flex items-center justify-center shadow-md shadow-saffron/20">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-serif text-3xl tracking-tight text-ink">Vediccare</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleLanguage}
              aria-pressed={showHindi}
              data-testid="language-hindi"
              className={`hidden sm:flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${showHindi ? "border-saffron bg-saffron-light/60 text-saffron" : "border-[#E8E1D5] text-ink/70 hover:border-saffron hover:text-saffron"}`}
            >
              <Languages className="h-4 w-4" /> {showHindi ? "English" : "हिंदी"}
            </button>
            <Link to="/login" data-testid="landing-signin" className="text-sm font-medium text-ink/70 hover:text-saffron transition px-3 py-2">Sign in</Link>
            <Link to="/register" data-testid="landing-getstarted" className="saffron-btn text-sm rounded-full px-5 py-2.5 font-semibold shadow-lg shadow-saffron/25">Get started →</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pt-14 md:pt-20 pb-20 grid md:grid-cols-[1.05fr_0.95fr] gap-10 md:gap-16 items-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-semibold text-[#75675B] mb-6">
            <Sparkles className="w-3.5 h-3.5 text-saffron" /> Ayurveda meets Modern Care
          </div>
          <h1 className="font-serif text-5xl md:text-[4.5rem] leading-[1.02] tracking-tight text-ink">
            Your quiet{" "}
            <em className="not-italic text-[#C85A17]">
              companion
            </em>
            <br />for lifelong wellness.
          </h1>
          <p className="mt-6 text-lg text-ink/65 max-w-lg leading-relaxed">
            Vediccare brings your health rituals under one roof — AI conversations, doctor visits, records, medicine reminders, and billing help — designed with the calm of tradition.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-x-5 gap-y-3 mt-8">
            {trustBadges.map((b) => (
              <div key={b.label} className="flex items-center gap-1.5 text-xs font-semibold text-ink/60">
                <b.icon className="w-3.5 h-3.5 text-saffron" /> {b.label}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link to="/register" data-testid="hero-cta-primary" className="saffron-btn rounded-full px-7 py-3.5 font-semibold flex items-center gap-2">
              Begin your journey <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" data-testid="hero-cta-demo" className="rounded-full border border-[#E8E1D5] bg-white px-7 py-3.5 font-medium text-ink hover:border-saffron hover:shadow-md transition-all">
              Try demo
            </Link>
          </div>

          <div className="mt-10 flex items-center gap-6 text-sm text-ink/55">
            <div><strong className="font-serif text-2xl text-saffron">5k+</strong><span className="ml-1">daily rituals</span></div>
            <div className="w-px h-8 bg-[#E8E1D5]" />
            <div><strong className="font-serif text-2xl text-herb">120+</strong><span className="ml-1">physicians</span></div>
            <div className="w-px h-8 bg-[#E8E1D5]" />
            <div><strong className="font-serif text-2xl text-ink">4.9★</strong><span className="ml-1">rating</span></div>
          </div>
        </motion.div>

        {/* Hero visual */}
        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9 }} className="relative hidden md:block">
          <div className="relative rounded-[2rem] overflow-hidden border border-[#E7DED0] shadow-[0_32px_80px_-28px_rgba(0,0,0,0.22)]">
            <img
              src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTV8MHwxfHNlYXJjaHwxfHxheXVydmVkYSUyMHdlbGxuZXNzJTIwcmVsYXh8ZW58MHx8fHwxNzg3NjMzMzQyfDA&ixlib=rb-4.1.0&q=85"
              alt="Ayurvedic wellness"
              className="w-full h-[520px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          </div>
          {/* Floating card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="absolute -bottom-5 left-5 bg-[#1D1A17] text-[#F7F3EE] rounded-2xl border border-white/10 shadow-xl px-5 py-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-herb flex items-center justify-center">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs text-[#B8A995] font-medium">Daily Dosha</div>
              <div className="font-serif text-lg text-[#F7F3EE]">Vata is balanced today</div>
            </div>
          </motion.div>
          {/* Second floating card */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="absolute -top-4 -right-4 bg-[#F9F5F0] rounded-2xl border border-[#E7DED0] shadow-xl px-4 py-3 flex items-center gap-2"
          >
            <Receipt className="w-4 h-4 text-saffron" />
            <div className="text-xs">
              <div className="font-semibold text-ink">Billing AI</div>
              <div className="text-ink/50">Invoice help ✓</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Hindi section ── */}
      {showHindi && (
        <section id="hindi" className="max-w-7xl mx-auto px-6 pb-24" lang="hi">
          <div className="rounded-[2.5rem] border border-[#E8E1D5] bg-gradient-to-br from-[#FFFDF8] to-saffron-light/20 p-8 md:p-14">
            <div className="max-w-2xl mb-12">
              <span className="text-xs uppercase tracking-[0.2em] text-saffron font-semibold">आपकी भाषा, आपकी देखभाल</span>
              <h2 className="font-serif text-4xl md:text-5xl mt-4 text-ink leading-tight">स्वस्थ जीवन की शांत शुरुआत।</h2>
              <p className="mt-4 text-lg text-ink/65 leading-relaxed">Vediccare आपकी देखभाल, डॉक्टरों, रिकॉर्ड, दवाइयों और बिल को एक सरल और भरोसेमंद जगह पर लाता है।</p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {hindiFeatures.map((feature, index) => (
                <motion.div key={feature.title} {...fadeUp} transition={{ delay: index * 0.08 }}
                  className={`bg-gradient-to-br ${feature.color} border border-[#E8E1D5] rounded-3xl p-7 hover:shadow-lg transition-all`}>
                  <div className={`w-12 h-12 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-5 shadow-md`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-serif text-2xl text-ink mb-2">{feature.title}</h3>
                  <p className="text-ink/65 leading-relaxed text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
            <Link to="/register" className="saffron-btn mt-10 inline-flex rounded-full px-7 py-3.5 font-semibold items-center gap-2 shadow-lg shadow-saffron/25" data-testid="hindi-cta">
              आज से शुरुआत करें <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-20">
        <motion.div {...fadeUp} className="max-w-2xl mb-16">
          <span className="text-xs uppercase tracking-[0.25em] text-saffron font-semibold">What we tend to</span>
          <h2 className="font-serif text-4xl md:text-5xl mt-4 text-ink leading-tight">
            The useful parts of care,<br />
            <span className="text-herb">kept close at hand.</span>
          </h2>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-0 border-t border-[#E7DED0]">
          {features.map((f, i) => (
            <motion.div key={f.title} {...fadeUp} transition={{ delay: i * 0.09 }}
              className="group relative border-b border-[#E7DED0] py-7 pr-4 hover:bg-[#F2ECE5] transition-colors duration-300">
              <div className="flex items-start justify-between mb-5">
                <div className={`w-10 h-10 rounded-xl border border-white flex items-center justify-center ${featureIconColors[i]}`}>
                  <f.icon className={`w-5 h-5 ${featureIconColors[i]}`} />
                </div>
                <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-ink/45">{f.tag}</span>
              </div>
              <h3 className="font-serif text-2xl text-ink mb-2">{f.title}</h3>
              <p className="text-ink/65 leading-relaxed text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-20">
        <motion.div {...fadeUp} className="text-center mb-14">
          <span className="text-xs uppercase tracking-[0.25em] text-herb font-semibold">Loved by patients</span>
          <h2 className="font-serif text-4xl md:text-5xl mt-4 text-ink">Real stories, real wellness.</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} {...fadeUp} transition={{ delay: i * 0.1 }}
              className="bg-white border border-[#E8E1D5] rounded-3xl p-7 hover:shadow-lg transition-all">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.stars }).map((_, k) => (
                  <Star key={k} className="w-4 h-4 fill-saffron text-saffron" />
                ))}
              </div>
              <p className="text-ink/75 leading-relaxed italic mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-saffron-light to-herb-light flex items-center justify-center text-sm font-bold text-saffron">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-ink">{t.name}</div>
                  <div className="text-xs text-ink/50">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-5 md:px-8 pb-20">
        <motion.div {...fadeUp}
          className="relative overflow-hidden rounded-[2rem] bg-[#1D1A17] text-white p-8 md:p-16">
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-2 text-sm font-medium mb-6 backdrop-blur-sm border border-white/20">
              <Sparkles className="w-4 h-4" /> Free to start · No credit card needed
            </div>
            <h2 className="font-serif text-5xl md:text-6xl leading-tight">
              Step gently into <em className="not-italic">Vediccare</em>.
            </h2>
            <p className="mt-6 text-lg opacity-85 leading-relaxed">Rooted in wisdom. Kind to your day. AI that understands your bill and your body.</p>
            <div className="mt-10 flex gap-4 flex-wrap">
              <Link to="/register" data-testid="cta-signup"
                className="bg-white text-saffron rounded-full px-7 py-3.5 font-semibold hover:bg-ivory transition shadow-lg">
                Create your account
              </Link>
              <Link to="/login" data-testid="cta-login"
                className="border border-white/40 rounded-full px-7 py-3.5 font-medium hover:bg-white/10 transition">
                I already have one
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#E7DED0]">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-10 flex flex-wrap justify-between items-center gap-4 text-sm text-ink/50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-saffron/20 flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-saffron" />
            </div>
            <span className="font-serif text-ink/70">Vediccare</span>
            <span>· © 2026 · Wellness with wisdom.</span>
          </div>
          <div>Made with care, not diagnosis. Consult a doctor for serious concerns.</div>
        </div>
      </footer>
    </div>
  );
}
