import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import {
  MessagesSquare,
  CalendarCheck,
  FileHeart,
  Bell,
  ArrowUpRight,
  Sunrise,
  Leaf,
  Clock3,
  HeartPulse,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

const quickActions = [
  {
    to: "/chatbot",
    title: "Check in",
    desc: "Ask about symptoms, sleep, digestion, or your next step.",
    icon: MessagesSquare,
    accent: "text-saffron dark:text-orange-400",
    testid: "hub-chatbot",
  },
  {
    to: "/appointments",
    title: "Book visit",
    desc: "Choose a doctor and pick a time that fits your day.",
    icon: CalendarCheck,
    accent: "text-herb dark:text-emerald-400",
    testid: "hub-appointments",
  },
  {
    to: "/records",
    title: "Review records",
    desc: "Find prescriptions, reports, and notes without digging.",
    icon: FileHeart,
    accent: "text-rose-500 dark:text-rose-400",
    testid: "hub-records",
  },
  {
    to: "/dosha-quiz",
    title: "Dosha Quiz",
    desc: "Discover your Ayurvedic body type — Vata, Pitta, or Kapha.",
    icon: Sparkles,
    accent: "text-violet-600 dark:text-violet-400",
    testid: "hub-dosha",
  },
];

const wellnessNotes = [
  {
    title: "Morning rhythm",
    text: "Warm water, a little sunlight, and a calm start before the day picks up speed.",
    tone: "bg-[#f7efe7] text-ink",
    iconTone: "bg-[#F9E7D8] text-saffron dark:bg-amber-950/60 dark:text-amber-400",
    icon: Sunrise,
  },
  {
    title: "Dosha check",
    text: "Take the Dosha Quiz to get personalised Ayurvedic insights based on your unique body type.",
    tone: "bg-[#eef3ea] text-ink",
    iconTone: "bg-[#E5F0E2] text-herb dark:bg-emerald-950/60 dark:text-emerald-400",
    icon: Leaf,
  },
  {
    title: "Care tasks",
    text: "Check your medicine reminders and upcoming appointments to stay on track today.",
    tone: "bg-[#f5f0fa] text-ink",
    iconTone: "bg-[#ECE8F5] text-[#7560A8] dark:bg-violet-950/60 dark:text-violet-400",
    icon: Bell,
  },
];

export default function Dashboard() {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.name?.split(" ")[0] || "there";

  const [stats, setStats] = useState({ appointments: "…", medicines: "…", records: "…" });

  useEffect(() => {
    const load = async () => {
      try {
        const [appts, meds, recs] = await Promise.all([
          api.get("/appointments"),
          api.get("/medicines"),
          api.get("/records"),
        ]);
        const pending = (appts.data || []).filter((a) => a.status === "pending").length;
        const today = new Date().toISOString().slice(0, 10);
        const dueMeds = (meds.data || []).filter(
          (m) => m.start_date <= today && m.end_date >= today && !m.taken_today
        ).length;
        setStats({
          appointments: pending ? `${pending} pending` : "0 pending",
          medicines: dueMeds ? `${dueMeds} due today` : "All done",
          records: `${(recs.data || []).length} saved`,
        });
      } catch {
        setStats({ appointments: "None pending", medicines: "Up to date", records: "All safe" });
      }
    };
    load();
  }, []);

  const rhythmNotes = [
    { label: "Appointments", value: stats.appointments },
    { label: "Medicines", value: stats.medicines },
    { label: "Records", value: stats.records },
  ];

  return (
    <div className="min-h-screen bg-[#F7F3EE] dark:bg-slate-950 text-[#1E1D1A] dark:text-slate-100 transition-colors duration-200">
      <Navbar />

      <main className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid lg:grid-cols-[1.45fr_0.75fr] gap-6"
        >
          <div className="rounded-[30px] border border-[#E7DED0] dark:border-slate-800 bg-[#F9F5F0] dark:bg-slate-900/90 p-6 md:p-8 shadow-[0_18px_40px_-28px_rgba(38,28,18,0.22)] dark:shadow-none">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#E7DED0] dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#695B4F] dark:text-slate-300">
                <Clock3 className="w-3.5 h-3.5 text-saffron" />
                {greet}
              </span>
              <span className="text-[11px] uppercase tracking-[0.18em] text-[#7A6C60] dark:text-slate-400">
                {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </div>

            <div className="mt-8 max-w-xl">
              <h1 className="font-serif text-5xl md:text-[4.2rem] leading-[0.92] tracking-[-0.04em] text-[#1E1D1A] dark:text-white">
                Keep the day
                <span className="block text-[#C85A17]">steady.</span>
              </h1>
              <p className="mt-4 text-base md:text-lg text-[#5F564E] dark:text-slate-300 leading-relaxed">
                You do not need a dozen tools at once. Start with the one thing that matters most today, and let the rest stay in the background.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/chatbot"
                data-testid="hub-chatbot"
                className="saffron-btn inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-md"
              >
                Open AI check-in
                <ArrowUpRight className="w-4 h-4" />
              </Link>
              <Link
                to="/appointments"
                className="inline-flex items-center gap-2 rounded-full border border-[#DCCEBB] dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-3 text-sm font-medium text-[#2F2C29] dark:text-slate-200 hover:border-[#C85A17]/40 hover:text-[#C85A17] transition-colors"
              >
                Book a visit
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 md:gap-8 text-sm text-[#5F564E] dark:text-slate-400">
              {rhythmNotes.map((item) => (
                <div key={item.label} className="border-l border-[#E7DED0] dark:border-slate-700 first:border-l-0 pl-0 first:pl-0 md:pl-6">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-[#7A6C60] dark:text-slate-400">{item.label}</div>
                  <div className="mt-1 font-semibold text-[#221F1D] dark:text-slate-200">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-[30px] bg-[#1D1A17] dark:bg-slate-900 border border-transparent dark:border-slate-800 p-6 md:p-7 text-[#F7F3EE] shadow-[0_30px_50px_-30px_rgba(20,15,10,0.6)]">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#B8A995] dark:text-slate-400">Today</div>
                <div className="mt-3 font-serif text-4xl leading-none text-white">{firstName}</div>
              </div>
              <div className="rounded-full border border-white/10 dark:border-slate-700 bg-white/5 dark:bg-slate-800 p-2.5">
                <HeartPulse className="w-5 h-5 text-[#F6C67E]" />
              </div>
            </div>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-white/10 dark:border-slate-800 bg-white/5 dark:bg-slate-800/60 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#CCBC9E] dark:text-slate-400">Focus</div>
                <div className="mt-2 text-xl font-medium text-white">Hydration + rest</div>
              </div>
              <div className="rounded-2xl border border-white/10 dark:border-slate-800 bg-[#2A241F] dark:bg-slate-800/80 p-4">
                <div className="text-[11px] uppercase tracking-[0.18em] text-[#CCBC9E] dark:text-slate-400">Next action</div>
                <div className="mt-2 text-xl font-medium text-white">Answer one quick health check</div>
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 dark:border-slate-800 pt-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#D0C4B5] dark:text-slate-300">Care path</span>
                <ShieldCheck className="w-4 h-4 text-[#D7B46D]" />
              </div>
              <div className="mt-3 text-sm text-[#F7F3EE]/80 dark:text-slate-300 leading-relaxed">
                A gentle check-in first, then a visit only if it adds something useful.
              </div>
            </div>
          </aside>
        </motion.section>

        {/* Spacious Quick Actions Grid */}
        <section className="mt-12">
          <div className="mb-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#7A6C60] dark:text-slate-400">Navigation Hub</div>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E1D1A] dark:text-white mt-1">What needs attention</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {quickActions.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                data-testid={item.testid}
                className="group flex flex-col justify-between rounded-3xl border border-[#F0E6DB] dark:border-slate-800 bg-white dark:bg-slate-900 p-6 transition-all duration-200 hover:border-[#D9C4AA] dark:hover:border-slate-700 hover:shadow-lg hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7EFE8] dark:bg-slate-800 shadow-sm">
                      <item.icon className={`w-6 h-6 ${item.accent}`} />
                    </div>
                    <div className="w-8 h-8 rounded-full border border-transparent group-hover:border-[#E8E1D5] dark:group-hover:border-slate-700 flex items-center justify-center transition-all">
                      <ArrowUpRight className="h-4 w-4 text-[#7A6C60] dark:text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </div>
                  </div>
                  <div className="text-xl font-medium text-[#1E1D1A] dark:text-white font-serif">{item.title}</div>
                  <div className="mt-2 text-sm text-[#5F564E] dark:text-slate-300 leading-relaxed">{item.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Daily Wellness Rhythm Cards */}
        <section className="mt-12">
          <div className="mb-6">
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#7A6C60] dark:text-slate-400">Daily Balance</div>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1E1D1A] dark:text-white mt-1">Ayurvedic rhythm for today</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {wellnessNotes.map((note) => (
              <motion.div
                key={note.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`${note.tone} dark:bg-slate-900 dark:border-slate-800 rounded-3xl border border-[#E7DED0] p-6 flex flex-col justify-between shadow-sm`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${note.iconTone} shadow-sm`}>
                      <note.icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="font-serif text-2xl text-[#1E1D1A] dark:text-white leading-tight">{note.title}</div>
                  <p className="mt-3 text-sm leading-relaxed text-[#4E473F] dark:text-slate-300">{note.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

