import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Leaf, Wind, Flame, Droplets, ArrowRight, ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";

const QUESTIONS = [
  {
    q: "How would you describe your body frame?",
    options: [
      { text: "Thin, light, find it hard to gain weight", dosha: "vata" },
      { text: "Medium, muscular, gain/lose weight easily", dosha: "pitta" },
      { text: "Broad, solid, tend to gain weight easily", dosha: "kapha" },
    ],
  },
  {
    q: "How is your digestion?",
    options: [
      { text: "Irregular — sometimes strong, sometimes weak", dosha: "vata" },
      { text: "Strong and sharp — get very hungry if meals are late", dosha: "pitta" },
      { text: "Slow and steady — can skip meals easily", dosha: "kapha" },
    ],
  },
  {
    q: "How do you handle stress?",
    options: [
      { text: "Become anxious, worried, overwhelmed", dosha: "vata" },
      { text: "Get irritable, frustrated, or controlling", dosha: "pitta" },
      { text: "Withdraw, become stubborn, or comfort-eat", dosha: "kapha" },
    ],
  },
  {
    q: "How is your sleep?",
    options: [
      { text: "Light sleeper, often wake up at night", dosha: "vata" },
      { text: "Moderate — fall asleep easily, wake up alert", dosha: "pitta" },
      { text: "Deep, long sleeper — hard to wake up", dosha: "kapha" },
    ],
  },
  {
    q: "What is your skin like?",
    options: [
      { text: "Dry, rough, or thin — gets chapped easily", dosha: "vata" },
      { text: "Oily, warm, prone to redness or acne", dosha: "pitta" },
      { text: "Thick, smooth, cool, and moist", dosha: "kapha" },
    ],
  },
  {
    q: "How do you prefer the weather?",
    options: [
      { text: "Love warmth, dislike cold and wind", dosha: "vata" },
      { text: "Prefer cool, dislike heat and humidity", dosha: "pitta" },
      { text: "Enjoy warm and dry weather, dislike damp/cold", dosha: "kapha" },
    ],
  },
  {
    q: "How is your energy throughout the day?",
    options: [
      { text: "Variable — bursts of energy followed by fatigue", dosha: "vata" },
      { text: "Moderate and focused, goal-driven", dosha: "pitta" },
      { text: "Steady and consistent, but slow to start", dosha: "kapha" },
    ],
  },
  {
    q: "How would you describe your memory?",
    options: [
      { text: "Quick to learn, quick to forget", dosha: "vata" },
      { text: "Sharp memory, detail-oriented", dosha: "pitta" },
      { text: "Slow to learn, but retains well long-term", dosha: "kapha" },
    ],
  },
  {
    q: "How is your appetite?",
    options: [
      { text: "Irregular — sometimes hungry, sometimes not", dosha: "vata" },
      { text: "Strong and consistent, irritable when hungry", dosha: "pitta" },
      { text: "Can go long without eating, emotional eating", dosha: "kapha" },
    ],
  },
  {
    q: "Which best describes your personality?",
    options: [
      { text: "Creative, enthusiastic, changeable, talkative", dosha: "vata" },
      { text: "Ambitious, organised, decisive, intense", dosha: "pitta" },
      { text: "Calm, caring, patient, loyal, stubborn", dosha: "kapha" },
    ],
  },
];

const DOSHA_INFO = {
  vata: {
    label: "Vata",
    emoji: "🌬️",
    icon: Wind,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    pill: "bg-[#ECE8F5] text-[#7560A8]",
    desc: "You are governed by Wind and Space. Vata types are creative, enthusiastic, and quick-thinking, but can become anxious or scattered when out of balance.",
    tips: [
      "Favour warm, cooked, oily foods — avoid raw, cold meals",
      "Maintain a regular daily routine (same wake/sleep times)",
      "Practice grounding yoga: Yin, Restorative, or gentle Hatha",
      "Use sesame oil for self-massage (Abhyanga) daily",
      "Stay warm; avoid excessive travel and wind exposure",
      "Helpful herbs: Ashwagandha, Shatavari, Licorice",
    ],
    avoid: ["Cold drinks", "Raw salads", "Irregular meals", "Excessive screen time", "Skipping sleep"],
  },
  pitta: {
    label: "Pitta",
    emoji: "🔥",
    icon: Flame,
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    pill: "bg-[#F9E7D8] text-saffron",
    desc: "You are governed by Fire and Water. Pitta types are driven, intelligent, and focused — natural leaders. Out of balance, they can be irritable and overly critical.",
    tips: [
      "Favour cooling, sweet, and bitter foods — avoid spicy/sour",
      "Take breaks and avoid overworking",
      "Practice calming activities: swimming, moonlit walks, Shitali pranayama",
      "Use coconut oil for self-massage",
      "Stay cool; avoid direct afternoon sun",
      "Helpful herbs: Brahmi, Neem, Amalaki",
    ],
    avoid: ["Spicy food", "Alcohol", "Competitive sports in heat", "Skipping meals", "Excessive coffee"],
  },
  kapha: {
    label: "Kapha",
    emoji: "💧",
    icon: Droplets,
    color: "text-herb",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    pill: "bg-[#E5F0E2] text-herb",
    desc: "You are governed by Earth and Water. Kapha types are grounded, nurturing, and steady. They are natural caregivers but can struggle with lethargy when out of balance.",
    tips: [
      "Favour light, warm, spicy, and dry foods",
      "Exercise vigorously every day — variety keeps you motivated",
      "Wake early (before 6 AM) to avoid Kapha-time heaviness",
      "Use dry brushing or stimulating massage",
      "Try new activities regularly to avoid stagnation",
      "Helpful herbs: Trikatu, Guggulu, Ginger",
    ],
    avoid: ["Heavy dairy", "Sweet snacks", "Daytime naps", "Sedentary lifestyle", "Cold/raw foods"],
  },
};

export default function DoshaQuiz() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const selectOption = (dosha) => {
    const newAnswers = [...answers];
    newAnswers[current] = dosha;
    setAnswers(newAnswers);
  };

  const next = () => {
    if (current < QUESTIONS.length - 1) setCurrent(current + 1);
    else finishQuiz();
  };

  const prev = () => { if (current > 0) setCurrent(current - 1); };

  const finishQuiz = async () => {
    const scores = { vata: 0, pitta: 0, kapha: 0 };
    answers.forEach((d) => { if (d) scores[d]++; });
    const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    setResult({ dominant, scores });
    setSaving(true);
    try {
      await api.post("/dosha", { dosha: dominant, scores });
      toast.success(`Your dosha is ${DOSHA_INFO[dominant].label} ${DOSHA_INFO[dominant].emoji}`);
    } catch {
      // not critical
    } finally {
      setSaving(false);
    }
  };

  const reset = () => { setCurrent(0); setAnswers([]); setResult(null); };

  const progress = ((current + 1) / QUESTIONS.length) * 100;

  if (result) {
    const info = DOSHA_INFO[result.dominant];
    const Icon = info.icon;
    return (
      <div className="min-h-screen motif-bg">
        <Navbar />
        <main className="max-w-2xl mx-auto px-6 py-10">
          {/* Result Header */}
          <div className={`rounded-3xl border-2 ${info.border} ${info.bg} p-8 mb-6 text-center`}>
            <div className="text-6xl mb-4">{info.emoji}</div>
            <h1 className="font-serif text-4xl text-ink mb-2">You are predominantly</h1>
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-2xl font-bold ${info.pill} mb-4`}>
              <Icon className="w-6 h-6" />
              {info.label} Dosha
            </div>
            <p className="text-ink/70 leading-relaxed max-w-lg mx-auto">{info.desc}</p>
          </div>

          {/* Scores */}
          <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 mb-6">
            <h2 className="font-serif text-xl text-ink mb-4">Your Dosha Breakdown</h2>
            {Object.entries(result.scores).map(([d, score]) => {
              const pct = Math.round((score / QUESTIONS.length) * 100);
              const di = DOSHA_INFO[d];
              return (
                <div key={d} className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`font-semibold ${di.color}`}>{di.emoji} {di.label}</span>
                    <span className="text-ink/60">{score}/{QUESTIONS.length} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-[#F7F3EE] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${d === 'vata' ? 'bg-violet-400' : d === 'pitta' ? 'bg-orange-400' : 'bg-emerald-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips */}
          <div className="bg-white rounded-2xl border border-[#E8E1D5] p-6 mb-6">
            <h2 className="font-serif text-xl text-ink mb-4">✅ Recommended for You</h2>
            <ul className="space-y-3">
              {info.tips.map((tip, i) => (
                <li key={i} className="flex gap-3">
                  <CheckCircle2 className="w-4 h-4 text-herb mt-0.5 flex-shrink-0" />
                  <span className="text-ink/70 text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Avoid */}
          <div className="bg-[#FEF7E5] rounded-2xl border border-[#F4E4A6] p-6 mb-6">
            <h2 className="font-serif text-xl text-ink mb-3">⚠️ Best to Minimise</h2>
            <div className="flex flex-wrap gap-2">
              {info.avoid.map((a, i) => (
                <span key={i} className="text-sm px-3 py-1 rounded-full bg-white border border-[#E8E1D5] text-ink/70">{a}</span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[#E8E1D5] bg-white text-ink/70 hover:border-saffron hover:text-saffron transition">
              <RotateCcw className="w-4 h-4" /> Retake Quiz
            </button>
            <button onClick={() => navigate("/wellness")} className="flex-1 saffron-btn py-3 rounded-xl font-semibold">
              Explore Wellness →
            </button>
          </div>
        </main>
      </div>
    );
  }

  const q = QUESTIONS[current];
  const selected = answers[current];

  return (
    <div className="min-h-screen motif-bg">
      <Navbar />
      <main className="max-w-xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-herb/10 rounded-full mb-4">
            <Leaf className="w-4 h-4 text-herb" />
            <span className="text-sm font-medium text-herb">Dosha Assessment</span>
          </div>
          <h1 className="font-serif text-3xl text-ink">Discover Your Ayurvedic Type</h1>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-ink/60 mb-2">
            <span>Question {current + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-[#F7F3EE] rounded-full overflow-hidden">
            <div className="h-full bg-saffron rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl border border-[#E8E1D5] p-8 mb-6">
          <h2 className="font-serif text-2xl text-ink mb-6 leading-snug">{q.q}</h2>
          <div className="space-y-3">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => selectOption(opt.dosha)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all ${
                  selected === opt.dosha
                    ? "border-saffron bg-saffron-light"
                    : "border-[#E8E1D5] hover:border-saffron/50 hover:bg-[#FAF7F3]"
                }`}
              >
                <span className="text-sm text-ink/80">{opt.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={prev}
            disabled={current === 0}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[#E8E1D5] text-ink/60 disabled:opacity-30 hover:border-saffron hover:text-saffron transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button
            onClick={next}
            disabled={!selected}
            className="flex-1 saffron-btn py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {current === QUESTIONS.length - 1 ? "See My Result" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
