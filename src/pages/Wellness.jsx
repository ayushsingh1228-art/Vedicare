import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Leaf, Search, AlertCircle, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Wellness() {
  const [condition, setCondition] = useState("");
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.get("/wellness/history")
      .then((response) => setHistory(response.data || []))
      .catch(() => setHistory([]));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!condition.trim()) {
      toast.error(language === "hi" ? "कृपया एक स्थिति दर्ज करें" : "Please enter a condition");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/wellness", { condition: condition.trim(), language });
      setGuidance(response.data);
      setHistory((prev) => [
        { ...response.data, condition: condition.trim() },
        ...prev.filter((item) => item.condition !== condition.trim()).slice(0, 4),
      ]);
      setCondition("");
    } catch (err) {
      toast.error(language === "hi" ? "कुछ गलत हो गया" : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const suggestedConditions = [
    { en: "Headache", hi: "सिरदर्द" },
    { en: "Acidity", hi: "एसिडिटी" },
    { en: "Stress", hi: "तनाव" },
    { en: "Joint Pain", hi: "जोड़ों का दर्द" },
    { en: "Fatigue", hi: "थकान" },
    { en: "Insomnia", hi: "अनिद्रा" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F5F1EB] dark:from-slate-900 dark:to-slate-800">
      <Navbar />
      <main className="max-w-4xl mx-auto px-5 md:px-8 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-herb/10 dark:bg-herb-light/20 rounded-full mb-4">
            <Leaf className="w-4 h-4 text-herb dark:text-herb-light" />
            <span className="text-sm font-medium text-herb dark:text-herb-light">
              {language === "hi" ? "परंपरागत समर्थन" : "Traditional Support"}
            </span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl text-ink dark:text-slate-100 mb-3 leading-tight">
            {language === "hi" ? "आयुर्वेदिक कल्याण" : "Ayurvedic Wellness"}
          </h1>
          <p className="text-ink/60 dark:text-slate-400 max-w-2xl mx-auto">
            {language === "hi"
              ? "एक स्थिति दर्ज करें और परंपरागत, जीवनशैली-आधारित समर्थन प्राप्त करें। यह स्वास्थ्य सलाह नहीं है—हमेशा गंभीर समस्याओं के लिए अपने डॉक्टर से मिलें।"
              : "Enter a condition and receive traditional, lifestyle-based support. This is not medical advice—always consult your doctor for serious issues."}
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-10">
          <div className="relative">
            <input
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder={language === "hi" ? "जैसे: सिरदर्द, एसिडिटी, तनाव..." : "E.g. headache, acidity, stress..."}
              className="w-full px-6 py-4 pr-14 rounded-2xl border border-[#E8E1D5] dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-saffron/30 focus:border-saffron text-lg text-ink dark:text-slate-100"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ink/40 dark:text-slate-500 hover:text-saffron dark:hover:text-saffron disabled:opacity-50"
            >
              <Search className="w-6 h-6" />
            </button>
          </div>
        </form>

        {/* Suggested Conditions */}
        {!guidance && (
          <div className="mb-12">
            <p className="text-sm text-ink/60 dark:text-slate-400 mb-4">
              {language === "hi" ? "या इनमें से एक आजमाएं:" : "Or try one of these:"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {suggestedConditions.map((c, i) => (
                <button
                  key={i}
                  onClick={() => {
                     setCondition(language === "hi" ? c.hi : c.en);
                  }}
                  className="px-4 py-3 text-sm font-medium rounded-xl border border-[#E8E1D5] dark:border-slate-700 bg-white dark:bg-slate-800 text-ink dark:text-slate-200 hover:bg-saffron-light dark:hover:bg-saffron-light/20 hover:border-saffron hover:text-saffron dark:hover:text-saffron-light transition"
                >
                  {language === "hi" ? c.hi : c.en}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <Sparkles className="w-8 h-8 mx-auto text-saffron mb-4 animate-pulse" />
            <p className="text-ink/60 dark:text-slate-400">
              {language === "hi" ? "मार्गदर्शन तैयार कर रहे हैं..." : "Preparing guidance..."}
            </p>
          </div>
        )}

        {/* Guidance Display */}
        {guidance && (
          <div className="space-y-6 mb-12">
            {/* Interpretation Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8E1D5] dark:border-slate-700 p-8">
              <div className="flex items-start gap-4">
                <Leaf className="w-6 h-6 text-herb dark:text-herb-light mt-1 flex-shrink-0" />
                <div>
                  <h2 className="font-serif text-2xl text-ink dark:text-slate-100 mb-2">
                    {language === "hi" ? "आयुर्वेदिक दृष्टिकोण" : "Ayurvedic Perspective"}
                  </h2>
                  <p className="text-ink/70 dark:text-slate-300 leading-relaxed">{guidance.interpretation}</p>
                </div>
              </div>
            </div>

            {/* Lifestyle Support Card */}
            {guidance.lifestyle && guidance.lifestyle.length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-[#E8E1D5] dark:border-slate-700 p-8">
                <div className="flex items-start gap-4 mb-6">
                  <CheckCircle2 className="w-6 h-6 text-herb dark:text-herb-light mt-1 flex-shrink-0" />
                  <h2 className="font-serif text-2xl text-ink dark:text-slate-100">
                    {language === "hi" ? "जीवनशैली समर्थन" : "Lifestyle Support"}
                  </h2>
                </div>
                <ul className="space-y-3">
                  {guidance.lifestyle.map((item, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="inline-block w-2 h-2 bg-saffron rounded-full mt-2 flex-shrink-0"></span>
                      <span className="text-ink/70 dark:text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timeline Card */}
            {guidance.timeline && (
              <div className="bg-herb-light/30 dark:bg-herb-light/10 rounded-2xl border border-herb/20 dark:border-herb/20 p-8">
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-herb dark:text-herb-light mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-serif text-xl text-herb dark:text-herb-light mb-2">
                      {language === "hi" ? "समयरेखा" : "Timeline"}
                    </h3>
                    <p className="text-herb/80 dark:text-herb-light/80 leading-relaxed">{guidance.timeline}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Safety Notice */}
            <div className="bg-[#FEF7E5] dark:bg-[#FEF7E5]/10 rounded-2xl border border-[#F4E4A6] dark:border-[#F4E4A6]/30 p-8">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-[#D4A574] dark:text-[#D4A574] mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-[#8B6F47] dark:text-[#E8CBAF] mb-2">
                    {language === "hi" ? "महत्वपूर्ण सुरक्षा नोट" : "Important Safety Notice"}
                  </h3>
                  <p className="text-[#8B6F47] dark:text-[#E8CBAF] text-sm leading-relaxed">
                    {language === "hi"
                      ? "यह सामान्य कल्याण जानकारी है, चिकित्सा सलाह नहीं। गंभीर, पुरानी, तीव्र, गर्भावस्था से संबंधित, या दवा से संबंधित समस्याओं के लिए हमेशा अपने डॉक्टर या एक योग्य आयुर्वेदिक चिकित्सक से सलाह लें। यदि आप किसी आपातकालीन स्थिति का अनुभव करते हैं, तो तुरंत चिकित्सा सहायता लें।"
                      : "This is general wellness information, not medical advice. Always consult your doctor or a qualified Ayurvedic practitioner for serious, chronic, urgent, pregnancy-related, or medication-related issues. If you experience an emergency, seek immediate medical attention."}
                  </p>
                </div>
              </div>
            </div>

            {/* Try Another Button */}
            <div className="text-center">
              <button
                onClick={() => {
                  setGuidance(null);
                  setCondition("");
                }}
                className="saffron-btn rounded-full px-8 py-3 font-medium"
              >
                {language === "hi" ? "एक और स्थिति आजमाएं" : "Try Another Condition"}
              </button>
            </div>
          </div>
        )}

        {/* Recent Queries */}
        {history.length > 0 && !guidance && (
          <div>
            <p className="text-sm text-ink/60 dark:text-slate-400 mb-4">
              {language === "hi" ? "हाल ही में:" : "Recent:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {history.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCondition(q.condition);
                    setGuidance(q);
                  }}
                  className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-[#E8E1D5] dark:border-slate-700 text-ink dark:text-slate-200 rounded-lg hover:bg-saffron-light dark:hover:bg-saffron-light/20 hover:border-saffron transition"
                >
                  {q.condition}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
