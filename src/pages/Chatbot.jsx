import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Send, Loader2, Sparkles, Leaf, Mic, Volume2, Square, Receipt, Bot, User } from "lucide-react";

const suggestions = [
  { text: "What is my dosha likely to be?", icon: Leaf, color: "text-herb bg-[#E5F0E2]" },
  { text: "How do I sleep better naturally?", icon: Sparkles, color: "text-saffron bg-[#F9E7D8]" },
  { text: "What does this invoice charge mean?", icon: Receipt, color: "text-[#A34A5E] bg-[#F4E4E8]" },
  { text: "Simple morning routine for energy?", icon: Bot, color: "text-[#7560A8] bg-[#ECE8F5]" },
];

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const endRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceTimerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get("/chat/history").then((r) => setMessages(r.data)).catch(() => {});
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    window.clearTimeout(voiceTimerRef.current);
  }, []);

  const toggleVoiceInput = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error("Voice input is not supported in this browser."); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = document.documentElement.lang === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      window.clearTimeout(voiceTimerRef.current);
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      send(transcript, true);
    };
    recognition.onnomatch = () => toast.error("I could not understand that. Please speak clearly and try again.");
    recognition.onerror = (event) => {
      window.clearTimeout(voiceTimerRef.current);
      setListening(false);
      toast.error(event.error === "not-allowed" ? "Microphone access is blocked. Allow it in your browser settings." : "I could not hear that. Please try again.");
    };
    recognition.onend = () => { window.clearTimeout(voiceTimerRef.current); setListening(false); };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    voiceTimerRef.current = window.setTimeout(() => {
      recognition.stop(); setListening(false);
      toast.error("No speech detected. Click the microphone and speak your question.");
    }, 12000);
  };

  const speak = (text) => {
    if (!window.speechSynthesis) { toast.error("Voice playback is not supported in this browser."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\u0900-\u097f]/.test(text) ? "hi-IN" : "en-IN";
    window.speechSynthesis.speak(utterance);
  };

  const send = async (text, speakReply = false) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: q, id: `u-${Date.now()}` }]);
    setLoading(true);
    try {
      const r = await api.post("/chat", { message: q });
      setMessages((m) => [...m, { role: "assistant", content: r.data.reply, id: `a-${Date.now()}` }]);
      if (speakReply) speak(r.data.reply);
    } catch {
      toast.error("AI is resting. Try again.");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "radial-gradient(ellipse at 20% 10%, rgba(200,90,23,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(79,121,66,0.06) 0%, transparent 50%), #FAF9F6" }}>
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center gap-4 px-2">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-saffron to-orange-500 flex items-center justify-center shadow-lg shadow-saffron/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-herb border-2 border-white" title="Online" />
          </div>
          <div>
            <h1 className="font-serif text-2xl text-ink leading-none">Vediccare AI</h1>
            <p className="text-xs text-ink/50 mt-0.5">Wellness · Ayurveda · Billing help · Not medical diagnosis</p>
          </div>
        </div>

        {/* Chat window */}
        <div
          data-testid="chat-window"
          className="flex-1 bg-white/80 backdrop-blur-xl border border-[#E8E1D5] rounded-3xl overflow-y-auto min-h-[420px] max-h-[60vh] p-6 space-y-1"
          style={{ scrollbarWidth: "thin" }}
        >
          {/* Empty state */}
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-herb-light to-saffron-light flex items-center justify-center mb-4 border border-[#E8E1D5]">
                <Leaf className="w-8 h-8 text-herb" />
              </div>
              <p className="font-serif text-2xl text-ink">Ask me anything.</p>
              <p className="text-ink/50 mt-2 text-sm max-w-xs">From doshas to daily habits, billing questions to appointments — I answer with care.</p>

              <div className="grid sm:grid-cols-2 gap-3 mt-8 w-full max-w-lg">
                {suggestions.map((s) => (
                  <button
                    key={s.text}
                    data-testid={`chat-suggestion-${s.text.slice(0, 20).replace(/\s/g, '-')}`}
                    onClick={() => send(s.text)}
                    className="group text-left text-sm px-4 py-3.5 rounded-2xl border border-[#E8E1D5] bg-white hover:border-saffron hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-start gap-3"
                  >
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                      <s.icon className="w-4 h-4" />
                    </span>
                    <span className="text-ink/70 group-hover:text-ink transition-colors">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id || m.content.slice(0, 10)} className={`flex items-end gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                {/* AI avatar */}
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-saffron to-orange-500 flex items-center justify-center shrink-0 mb-1 shadow-md shadow-saffron/20">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  data-testid={`msg-${m.role}`}
                  className={`max-w-[78%] px-5 py-3.5 rounded-2xl whitespace-pre-wrap text-sm leading-relaxed relative group
                    ${m.role === 'user'
                      ? 'bubble-user bg-gradient-to-br from-saffron to-orange-500 text-white rounded-br-sm shadow-lg shadow-saffron/20'
                      : 'bubble-ai bg-white border border-[#E8E1D5] text-ink rounded-bl-sm shadow-sm'
                    }`}
                >
                  {m.content}
                  {m.role === 'assistant' && (
                    <button
                      type="button"
                      onClick={() => speak(m.content)}
                      className="absolute -bottom-5 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-ink/40 hover:text-saffron"
                      aria-label="Speak response"
                      title="Speak response"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* User avatar */}
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-herb-light to-herb/30 flex items-center justify-center shrink-0 mb-1 border border-[#E8E1D5]">
                    <User className="w-4 h-4 text-herb" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex items-end gap-2.5 justify-start">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-saffron to-orange-500 flex items-center justify-center shrink-0 shadow-md shadow-saffron/20">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-[#E8E1D5] px-5 py-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
                  <span className="typing-dot w-2 h-2 rounded-full bg-saffron/60 inline-block" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-saffron/60 inline-block" />
                  <span className="typing-dot w-2 h-2 rounded-full bg-saffron/60 inline-block" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="relative">
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-2 items-center bg-white border border-[#E8E1D5] rounded-2xl pl-5 pr-2 py-2 shadow-lg shadow-black/5 focus-within:border-saffron/50 focus-within:shadow-saffron/10 transition-all"
          >
            <input
              ref={inputRef}
              data-testid="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about wellness, Ayurveda, billing or appointments…"
              className="flex-1 bg-transparent focus:outline-none py-2 text-sm text-ink placeholder:text-ink/40"
            />
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`rounded-xl w-10 h-10 flex items-center justify-center transition-all ${
                listening
                  ? "bg-saffron text-white pulse-glow"
                  : "text-ink/40 hover:bg-saffron-light/50 hover:text-saffron"
              }`}
              aria-label={listening ? "Stop voice input" : "Start voice input"}
              title={listening ? "Stop voice input" : "Start voice input"}
            >
              {listening ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              data-testid="chat-send"
              type="submit"
              disabled={loading || !input.trim()}
              className="saffron-btn rounded-xl w-11 h-11 flex items-center justify-center disabled:opacity-40 disabled:transform-none disabled:shadow-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          {listening && (
            <p className="absolute -bottom-6 left-0 right-0 text-center text-xs text-saffron font-medium animate-pulse">
              🎙 Listening… speak your question now
            </p>
          )}
        </div>

      </main>
    </div>
  );
}
