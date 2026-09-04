import { createContext, useContext, useEffect, useMemo, useState } from "react";

const translations = {
  "Sign in": "साइन इन",
  "Get started": "शुरू करें",
  "Home": "होम",
  "AI Chat": "एआई चैट",
  "Book": "बुक करें",
  "Records": "रिकॉर्ड",
  "Reminders": "रिमाइंडर",
  "Appointments": "अपॉइंटमेंट",
  "Logout": "लॉग आउट",
  "Loading…": "लोड हो रहा है…",
  "Ayurveda meets Modern Care": "आयुर्वेद और आधुनिक देखभाल",
  "Your quiet": "आपका शांत",
  "companion": "साथी",
  "for lifelong wellness.": "स्वस्थ जीवन के लिए।",
  "Begin your journey": "अपनी यात्रा शुरू करें",
  "Try demo": "डेमो आजमाएं",
  "daily rituals": "दैनिक स्वास्थ्य आदतें",
  "physicians": "डॉक्टर",
  "wellbeing score": "स्वास्थ्य स्कोर",
  "Daily Dosha": "आज का दोष",
  "Vata is balanced today": "आज वात संतुलित है",
  "What we tend to": "हम आपकी देखभाल कैसे करते हैं",
  "Four rituals, one calm home.": "चार सुविधाएं, एक शांत स्वास्थ्य केंद्र।",
  "Ask anything from doshas to daily habits. Warm, grounded answers rooted in Ayurveda + modern care.": "दोष से लेकर रोजमर्रा की आदतों तक कुछ भी पूछें। आयुर्वेद और आधुनिक देखभाल से प्रेरित सरल जवाब पाएं।",
  "Browse trusted physicians and book slots. Doctors approve in a tap.": "विश्वसनीय डॉक्टर खोजें और समय बुक करें। डॉक्टर एक टैप में स्वीकृति देते हैं।",
  "Prescriptions, lab reports, discharge summaries — all safely organised.": "प्रिस्क्रिप्शन, जांच रिपोर्ट और डिस्चार्ज सारांश सुरक्षित तरीके से व्यवस्थित रखें।",
  "Timely nudges in-app and to your inbox so no dose is missed.": "ऐप और इनबॉक्स में समय पर रिमाइंडर पाएं ताकि कोई खुराक न छूटे।",
  "Step gently into": "धीरे-धीरे कदम रखें",
  "Free to start. Rooted in wisdom. Kind to your day.": "शुरुआत बिल्कुल मुफ्त। ज्ञान पर आधारित और आपके दिन के लिए सहज।",
  "Create your account": "अपना खाता बनाएं",
  "I already have one": "मेरा खाता पहले से है",
  "Wellness with wisdom.": "ज्ञान के साथ स्वास्थ्य।",
  "Made with care, not diagnosis. Consult a doctor for serious concerns.": "देखभाल के लिए बनाया गया है, निदान के लिए नहीं। गंभीर समस्या में डॉक्टर से सलाह लें।",
  "Your calm command centre.": "आपका शांत स्वास्थ्य केंद्र।",
  "Four rituals await. Pick where your day leads you.": "चार स्वास्थ्य सुविधाएं आपका इंतजार कर रही हैं। अपने दिन के लिए चुनें।",
  "AI Wellness Chat": "एआई स्वास्थ्य चैट",
  "Ask about doshas, diet, sleep or stress. Grounded, warm answers.": "दोष, आहार, नींद या तनाव के बारे में पूछें। सरल और उपयोगी जवाब पाएं।",
  "Book Appointment": "अपॉइंटमेंट बुक करें",
  "Meet a physician on your rhythm. Track approvals.": "अपनी सुविधा से डॉक्टर से मिलें और स्वीकृति देखें।",
  "Health Records": "स्वास्थ्य रिकॉर्ड",
  "Everything you carry — safely in one place.": "आपके सभी स्वास्थ्य दस्तावेज एक सुरक्षित जगह पर।",
  "Medicine Reminders": "दवा रिमाइंडर",
  "Gentle nudges by app and email.": "ऐप और ईमेल से समय पर याद दिलाने वाले संदेश।",
  "Today's Ayurvedic Tip": "आज का आयुर्वेदिक सुझाव",
  "Your dosha guess": "आपका दोष अनुमान",
  "Recommended": "अनुशंसित",
  "3 min breathing": "3 मिनट का श्वास अभ्यास",
  "Book an appointment": "अपॉइंटमेंट बुक करें",
  "Meet a physician on your rhythm.": "अपनी सुविधा से डॉक्टर से मिलें।",
  "Choose your doctor": "अपना डॉक्टर चुनें",
  "Pick date & time": "तारीख और समय चुनें",
  "Available slots on": "उपलब्ध समय",
  "Brief reason (optional)": "संक्षिप्त कारण (वैकल्पिक)",
  "Request appointment": "अपॉइंटमेंट का अनुरोध करें",
  "Your appointments": "आपकी अपॉइंटमेंट",
  "No appointments yet. Book one above.": "अभी कोई अपॉइंटमेंट नहीं है। ऊपर से बुक करें।",
  "Physician dashboard": "डॉक्टर डैशबोर्ड",
  "Review the day. Approve with a tap.": "दिन की अपॉइंटमेंट देखें और एक टैप में स्वीकृत करें।",
  "Awaiting your approval": "आपकी स्वीकृति की प्रतीक्षा",
  "All caught up. A calm moment.": "सब अपडेट है। थोड़ा सुकून का समय।",
  "Recent decisions": "हाल के निर्णय",
  "Nothing here yet.": "अभी यहां कुछ नहीं है।",
  "Vediccare AI": "Vediccare एआई",
  "A gentle wellness companion · Not medical diagnosis": "आपका स्वास्थ्य साथी · चिकित्सीय निदान नहीं",
  "Ask me anything.": "मुझसे कुछ भी पूछें।",
  "From doshas to daily habits — I'll answer with care.": "दोष से लेकर रोजमर्रा की आदतों तक, मैं ध्यान से जवाब दूंगा।",
  "Type your wellness question…": "अपना स्वास्थ्य प्रश्न लिखें…",
  "Thinking gently…": "सोच रहा हूं…",
  "Health records": "स्वास्थ्य रिकॉर्ड",
  "Add record": "रिकॉर्ड जोड़ें",
  "New health record": "नया स्वास्थ्य रिकॉर्ड",
  "Save record": "रिकॉर्ड सेव करें",
  "No records yet.": "अभी कोई रिकॉर्ड नहीं है।",
  "Add your first prescription or lab report.": "अपना पहला प्रिस्क्रिप्शन या जांच रिपोर्ट जोड़ें।",
  "Medicine reminders": "दवा रिमाइंडर",
  "Gentle nudges in-app and to your inbox.": "ऐप और इनबॉक्स में समय पर रिमाइंडर पाएं।",
  "Add medicine": "दवा जोड़ें",
  "No medicines yet.": "अभी कोई दवा नहीं है।",
  "Add one to start gentle reminders.": "रिमाइंडर शुरू करने के लिए दवा जोड़ें।",
  "Start": "शुरू",
  "End (optional)": "समाप्ति (वैकल्पिक)",
  "Notes (optional)": "नोट्स (वैकल्पिक)",
  "Save": "सेव करें",
  "Welcome back.": "वापसी पर स्वागत है।",
  "Continue your wellness ritual.": "अपनी स्वास्थ्य यात्रा जारी रखें।",
  "Email": "ईमेल",
  "Password": "पासवर्ड",
  "or": "या",
  "Continue as demo user": "डेमो उपयोगकर्ता के रूप में जारी रखें",
  "New here?": "यहां नए हैं?",
  "Create an account": "खाता बनाएं",
  "Create your account.": "अपना खाता बनाएं।",
  "A gentle start to lifelong wellness.": "स्वस्थ जीवन की एक शांत शुरुआत।",
  "I'm a Patient": "मैं मरीज हूं",
  "I'm a Doctor": "मैं डॉक्टर हूं",
  "Full name": "पूरा नाम",
  "Specialization": "विशेषज्ञता",
  "Create account": "खाता बनाएं",
  "Already here?": "पहले से खाता है?",
  "Your name": "आपका नाम",
  "Demo unavailable": "डेमो उपलब्ध नहीं है",
  "Login failed": "लॉगिन असफल रहा",
  "Registration failed": "पंजीकरण असफल रहा",
};

const reverseTranslations = Object.fromEntries(Object.entries(translations).map(([english, hindi]) => [hindi, english]));

function translatePage(language) {
  const dictionary = language === "hi" ? translations : reverseTranslations;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  nodes.forEach((textNode) => {
    const value = textNode.nodeValue.trim();
    if (!value || !dictionary[value]) return;
    textNode.nodeValue = textNode.nodeValue.replace(value, dictionary[value]);
  });
  document.querySelectorAll("[placeholder]").forEach((element) => {
    const value = element.getAttribute("placeholder");
    if (dictionary[value]) element.setAttribute("placeholder", dictionary[value]);
  });
}

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem("vediccare_language") || "en");

  useEffect(() => {
    localStorage.setItem("vediccare_language", language);
    document.documentElement.lang = language === "hi" ? "hi" : "en";
    translatePage(language);
    const observer = new MutationObserver(() => translatePage(language));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(() => ({
    language,
    isHindi: language === "hi",
    toggleLanguage: () => setLanguage((current) => current === "hi" ? "en" : "hi"),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
