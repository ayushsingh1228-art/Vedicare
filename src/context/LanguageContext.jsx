import { createContext, useContext, useEffect, useMemo, useState } from "react";

const translations = {
  hi: {
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
    "Registration failed": "पंजीकरण असफल रहा"
  },
  ta: {
    "Sign in": "உள்நுழைக",
    "Get started": "தொடங்குங்கள்",
    "Home": "முகப்பு",
    "AI Chat": "AI அரட்டை",
    "Book": "பதிவு செய்",
    "Records": "பதிவுகள்",
    "Reminders": "நினைவூட்டல்கள்",
    "Appointments": "சந்திப்புகள்",
    "Logout": "வெளியேறு",
    "Loading…": "ஏற்றுகிறது…",
    "Ayurveda meets Modern Care": "ஆயுர்வேதம் மற்றும் நவீன பராமரிப்பு",
    "Your quiet": "உங்கள் அமைதியான",
    "companion": "தோழன்",
    "for lifelong wellness.": "ஆயுள் முழுவதும் நல்வாழ்வுக்கு.",
    "Begin your journey": "உங்கள் பயணத்தைத் தொடங்குங்கள்",
    "Try demo": "டெமோவை முயற்சிக்கவும்",
    "daily rituals": "தினசரி பழக்கங்கள்",
    "physicians": "மருத்துவர்கள்",
    "wellbeing score": "நல்வாழ்வு மதிப்பெண்",
    "Daily Dosha": "இன்றைய தோஷம்",
    "Vata is balanced today": "இன்று வாதம் சீராக உள்ளது",
    "What we tend to": "நாங்கள் உங்களை எப்படி கவனிக்கிறோம்",
    "Four rituals, one calm home.": "நான்கு சேவைகள், ஒரு அமைதியான வீடு.",
    "Ask anything from doshas to daily habits. Warm, grounded answers rooted in Ayurveda + modern care.": "தோஷங்கள் முதல் தினசரி பழக்கங்கள் வரை எதையும் கேளுங்கள்.",
    "Browse trusted physicians and book slots. Doctors approve in a tap.": "நம்பகமான மருத்துவர்களைத் தேடி பதிவு செய்யுங்கள்.",
    "Prescriptions, lab reports, discharge summaries — all safely organised.": "மருந்து குறிப்புகள், ஆய்வக அறிக்கைகள் - அனைத்தும் பாதுகாப்பாக சேமிக்கப்படும்.",
    "Timely nudges in-app and to your inbox so no dose is missed.": "சரியான நேரத்தில் நினைவூட்டல்கள் பெறவும்.",
    "Step gently into": "மெதுவாக உள்ளே நுழையுங்கள்",
    "Free to start. Rooted in wisdom. Kind to your day.": "தொடங்க இலவசம். அறிவை அடிப்படையாகக் கொண்டது.",
    "Create your account": "உங்கள் கணக்கை உருவாக்கவும்",
    "I already have one": "எனக்கு ஏற்கனவே கணக்கு உள்ளது",
    "Wellness with wisdom.": "அறிவுடன் கூடிய நல்வாழ்வு.",
    "Made with care, not diagnosis. Consult a doctor for serious concerns.": "பராமரிப்புக்காக உருவாக்கப்பட்டது, நோயறிதலுக்காக அல்ல.",
    "Your calm command centre.": "உங்கள் அமைதியான கட்டுப்பாட்டு மையம்.",
    "Four rituals await. Pick where your day leads you.": "நான்கு சேவைகள் காத்திருக்கின்றன. உங்களுக்கு தேவையானதை தேர்வு செய்யவும்.",
    "AI Wellness Chat": "AI நல்வாழ்வு அரட்டை",
    "Ask about doshas, diet, sleep or stress. Grounded, warm answers.": "தோஷங்கள், உணவு, தூக்கம் பற்றி கேளுங்கள்.",
    "Book Appointment": "சந்திப்பை பதிவு செய்",
    "Meet a physician on your rhythm. Track approvals.": "உங்கள் வசதிக்கேற்ப மருத்துவரை சந்திக்கவும்.",
    "Health Records": "சுகாதார பதிவுகள்",
    "Everything you carry — safely in one place.": "உங்கள் ஆவணங்கள் அனைத்தும் பாதுகாப்பான ஒரே இடத்தில்.",
    "Medicine Reminders": "மருந்து நினைவூட்டல்கள்",
    "Gentle nudges by app and email.": "பயன்பாடு மற்றும் மின்னஞ்சல் மூலம் நினைவூட்டல்கள்.",
    "Today's Ayurvedic Tip": "இன்றைய ஆயுர்வேத குறிப்பு",
    "Your dosha guess": "உங்கள் தோஷத்தின் கணிப்பு",
    "Recommended": "பரிந்துரைக்கப்படுகிறது",
    "3 min breathing": "3 நிமிடம் மூச்சுப் பயிற்சி",
    "Book an appointment": "சந்திப்பை பதிவு செய்",
    "Meet a physician on your rhythm.": "உங்கள் வசதிக்கேற்ப மருத்துவரை சந்திக்கவும்.",
    "Choose your doctor": "உங்கள் மருத்துவரை தேர்வு செய்யவும்",
    "Pick date & time": "தேதி மற்றும் நேரத்தைத் தேர்வு செய்யவும்",
    "Available slots on": "கிடைக்கும் நேரங்கள்",
    "Brief reason (optional)": "காரணம் (விரும்பினால்)",
    "Request appointment": "சந்திப்பைக் கோருக",
    "Your appointments": "உங்கள் சந்திப்புகள்",
    "No appointments yet. Book one above.": "இன்னும் சந்திப்புகள் இல்லை. மேலே பதிவு செய்யவும்.",
    "Physician dashboard": "மருத்துவர் முகப்பு",
    "Review the day. Approve with a tap.": "சந்திப்புகளை மதிப்பாய்வு செய்து அனுமதிக்கவும்.",
    "Awaiting your approval": "உங்கள் ஒப்புதலுக்காக காத்திருக்கிறது",
    "All caught up. A calm moment.": "அனைத்தும் புதுப்பிக்கப்பட்டுள்ளது.",
    "Recent decisions": "சமீபத்திய முடிவுகள்",
    "Nothing here yet.": "இங்கு எதுவும் இல்லை.",
    "Vediccare AI": "Vediccare AI",
    "A gentle wellness companion · Not medical diagnosis": "ஒரு அமைதியான நல்வாழ்வு தோழன்",
    "Ask me anything.": "என்னிடம் எதையும் கேளுங்கள்.",
    "From doshas to daily habits — I'll answer with care.": "தோஷங்கள் முதல் தினசரி பழக்கங்கள் வரை - நான் பதிலளிப்பேன்.",
    "Type your wellness question…": "உங்கள் கேள்வியைத் தட்டச்சு செய்க…",
    "Thinking gently…": "சிந்திக்கிறது…",
    "Health records": "சுகாதார பதிவுகள்",
    "Add record": "பதிவைச் சேர்",
    "New health record": "புதிய சுகாதார பதிவு",
    "Save record": "பதிவைச் சேமி",
    "No records yet.": "பதிவுகள் எதுவும் இல்லை.",
    "Add your first prescription or lab report.": "உங்கள் முதல் மருந்து குறிப்பைச் சேர்க்கவும்.",
    "Medicine reminders": "மருந்து நினைவூட்டல்கள்",
    "Gentle nudges in-app and to your inbox.": "பயன்பாடு மற்றும் மின்னஞ்சல் மூலம் நினைவூட்டல்கள்.",
    "Add medicine": "மருந்தைச் சேர்",
    "No medicines yet.": "மருந்துகள் எதுவும் இல்லை.",
    "Add one to start gentle reminders.": "நினைவூட்டல்களைத் தொடங்க ஒன்றைச் சேர்க்கவும்.",
    "Start": "தொடக்கம்",
    "End (optional)": "முடிவு (விரும்பினால்)",
    "Notes (optional)": "குறிப்புகள் (விரும்பினால்)",
    "Save": "சேமி",
    "Welcome back.": "மீண்டும் வரவேற்கிறோம்.",
    "Continue your wellness ritual.": "உங்கள் நல்வாழ்வுப் பயணத்தைத் தொடரவும்.",
    "Email": "மின்னஞ்சல்",
    "Password": "கடவுச்சொல்",
    "or": "அல்லது",
    "Continue as demo user": "டெமோ பயனராக தொடரவும்",
    "New here?": "இங்கு புதியவரா?",
    "Create an account": "கணக்கை உருவாக்கவும்",
    "Create your account.": "உங்கள் கணக்கை உருவாக்கவும்.",
    "A gentle start to lifelong wellness.": "ஆயுள் முழுவதும் நல்வாழ்வுக்கு ஒரு நல்ல தொடக்கம்.",
    "I'm a Patient": "நான் ஒரு நோயாளி",
    "I'm a Doctor": "நான் ஒரு மருத்துவர்",
    "Full name": "முழு பெயர்",
    "Specialization": "சிறப்புத் துறை",
    "Create account": "கணக்கை உருவாக்கவும்",
    "Already here?": "ஏற்கனவே உள்ளதா?",
    "Your name": "உங்கள் பெயர்",
    "Demo unavailable": "டெமோ கிடைக்கவில்லை",
    "Login failed": "உள்நுழைவு தோல்வி",
    "Registration failed": "பதிவு தோல்வி"
  },
  mr: {
    "Sign in": "साइन इन करा",
    "Get started": "सुरू करा",
    "Home": "मुख्यपृष्ठ",
    "AI Chat": "एआय चॅट",
    "Book": "बुक करा",
    "Records": "नोंदी",
    "Reminders": "रिमाइंडर",
    "Appointments": "अपॉइंटमेंट",
    "Logout": "लॉग आउट",
    "Loading…": "लोड होत आहे…",
    "Ayurveda meets Modern Care": "आयुर्वेद आणि आधुनिक काळजी",
    "Your quiet": "तुमचा शांत",
    "companion": "सोबती",
    "for lifelong wellness.": "आजीवन निरोगीपणासाठी.",
    "Begin your journey": "तुमचा प्रवास सुरू करा",
    "Try demo": "डेमो वापरून पहा",
    "daily rituals": "दैनंदिन सवयी",
    "physicians": "डॉक्टर",
    "wellbeing score": "आरोग्य गुण",
    "Daily Dosha": "आजचा दोष",
    "Vata is balanced today": "आज वात संतुलित आहे",
    "What we tend to": "आम्ही तुमची काळजी कशी घेतो",
    "Four rituals, one calm home.": "चार सुविधा, एक शांत घर.",
    "Ask anything from doshas to daily habits. Warm, grounded answers rooted in Ayurveda + modern care.": "दोषांपासून दैनंदिन सवयींपर्यंत काहीही विचारा. आयुर्वेदावर आधारित उत्तरे मिळवा.",
    "Browse trusted physicians and book slots. Doctors approve in a tap.": "विश्वसनीय डॉक्टर शोधा आणि वेळ बुक करा.",
    "Prescriptions, lab reports, discharge summaries — all safely organised.": "प्रिस्क्रिप्शन आणि लॅब रिपोर्ट सुरक्षित ठेवा.",
    "Timely nudges in-app and to your inbox so no dose is missed.": "वेळेवर रिमाइंडर मिळवा म्हणजे कोणताही डोस चुकणार नाही.",
    "Step gently into": "हळूवारपणे पाऊल टाका",
    "Free to start. Rooted in wisdom. Kind to your day.": "सुरू करण्यासाठी मोफत. ज्ञानावर आधारित.",
    "Create your account": "तुमचे खाते तयार करा",
    "I already have one": "माझे खाते आधीच आहे",
    "Wellness with wisdom.": "ज्ञानासह निरोगीपणा.",
    "Made with care, not diagnosis. Consult a doctor for serious concerns.": "काळजीसाठी बनवले आहे, निदानासाठी नाही. डॉक्टरांचा सल्ला घ्या.",
    "Your calm command centre.": "तुमचे शांत नियंत्रण केंद्र.",
    "Four rituals await. Pick where your day leads you.": "चार सुविधा तुमची वाट पाहत आहेत.",
    "AI Wellness Chat": "एआय वेलनेस चॅट",
    "Ask about doshas, diet, sleep or stress. Grounded, warm answers.": "दोष, आहार, झोप याबद्दल विचारा.",
    "Book Appointment": "अपॉइंटमेंट बुक करा",
    "Meet a physician on your rhythm. Track approvals.": "तुमच्या सोयीनुसार डॉक्टरांना भेटा.",
    "Health Records": "आरोग्य नोंदी",
    "Everything you carry — safely in one place.": "तुमची सर्व माहिती एका सुरक्षित ठिकाणी.",
    "Medicine Reminders": "औषध रिमाइंडर",
    "Gentle nudges by app and email.": "अॅप आणि ईमेलद्वारे वेळेवर रिमाइंडर.",
    "Today's Ayurvedic Tip": "आजचा आयुर्वेदिक सल्ला",
    "Your dosha guess": "तुमचा दोष अंदाज",
    "Recommended": "शिफारस केलेले",
    "3 min breathing": "३ मिनिटांचा श्वासोच्छ्वास",
    "Book an appointment": "अपॉइंटमेंट बुक करा",
    "Meet a physician on your rhythm.": "तुमच्या सोयीनुसार डॉक्टरांना भेटा.",
    "Choose your doctor": "तुमचे डॉक्टर निवडा",
    "Pick date & time": "तारीख आणि वेळ निवडा",
    "Available slots on": "उपलब्ध वेळा",
    "Brief reason (optional)": "थोडक्यात कारण (पर्यायी)",
    "Request appointment": "अपॉइंटमेंटची विनंती करा",
    "Your appointments": "तुमच्या अपॉइंटमेंट",
    "No appointments yet. Book one above.": "अद्याप कोणतीही अपॉइंटमेंट नाही. वरून बुक करा.",
    "Physician dashboard": "डॉक्टर डॅशबोर्ड",
    "Review the day. Approve with a tap.": "दिवसाचा आढावा घ्या आणि एका टॅपने मंजूर करा.",
    "Awaiting your approval": "तुमच्या मंजुरीची प्रतीक्षा आहे",
    "All caught up. A calm moment.": "सर्व अद्ययावत आहे. एक शांत क्षण.",
    "Recent decisions": "अलीकडील निर्णय",
    "Nothing here yet.": "येथे अद्याप काहीही नाही.",
    "Vediccare AI": "Vediccare एआय",
    "A gentle wellness companion · Not medical diagnosis": "तुमचा आरोग्य सोबती · वैद्यकीय निदान नाही",
    "Ask me anything.": "मला काहीही विचारा.",
    "From doshas to daily habits — I'll answer with care.": "दोषांपासून दैनंदिन सवयींपर्यंत — मी उत्तरे देईन.",
    "Type your wellness question…": "तुमचा प्रश्न टाइप करा…",
    "Thinking gently…": "विचार करत आहे…",
    "Health records": "आरोग्य नोंदी",
    "Add record": "नोंद जोडा",
    "New health record": "नवीन आरोग्य नोंद",
    "Save record": "नोंद जतन करा",
    "No records yet.": "अद्याप कोणतीही नोंद नाही.",
    "Add your first prescription or lab report.": "तुमचे पहिले प्रिस्क्रिप्शन जोडा.",
    "Medicine reminders": "औषध रिमाइंडर",
    "Gentle nudges in-app and to your inbox.": "अॅप आणि इनबॉक्समध्ये वेळेवर रिमाइंडर.",
    "Add medicine": "औषध जोडा",
    "No medicines yet.": "अद्याप कोणतीही औषधे नाहीत.",
    "Add one to start gentle reminders.": "रिमाइंडर सुरू करण्यासाठी औषध जोडा.",
    "Start": "सुरू करा",
    "End (optional)": "शेवट (पर्यायी)",
    "Notes (optional)": "नोंदी (पर्यायी)",
    "Save": "जतन करा",
    "Welcome back.": "पुन्हा स्वागत आहे.",
    "Continue your wellness ritual.": "तुमचा आरोग्य प्रवास सुरू ठेवा.",
    "Email": "ईमेल",
    "Password": "पासवर्ड",
    "or": "किंवा",
    "Continue as demo user": "डेमो वापरकर्ता म्हणून सुरू ठेवा",
    "New here?": "येथे नवीन आहात?",
    "Create an account": "खाते तयार करा",
    "Create your account.": "तुमचे खाते तयार करा.",
    "A gentle start to lifelong wellness.": "आजीवन निरोगीपणाची एक शांत सुरुवात.",
    "I'm a Patient": "मी रुग्ण आहे",
    "I'm a Doctor": "मी डॉक्टर आहे",
    "Full name": "पूर्ण नाव",
    "Specialization": "विशेषज्ञता",
    "Create account": "खाते तयार करा",
    "Already here?": "आधीपासून खाते आहे?",
    "Your name": "तुमचे नाव",
    "Demo unavailable": "डेमो उपलब्ध नाही",
    "Login failed": "लॉगिन अयशस्वी",
    "Registration failed": "नोंदणी अयशस्वी"
  }
};

const reverseTranslations = {
  hi: Object.fromEntries(Object.entries(translations.hi).map(([en, hi]) => [hi, en])),
  ta: Object.fromEntries(Object.entries(translations.ta).map(([en, ta]) => [ta, en])),
  mr: Object.fromEntries(Object.entries(translations.mr).map(([en, mr]) => [mr, en]))
};

function translatePage(targetLang) {
  let dictionary = {};
  
  if (targetLang === 'en') {
    // English is target, map all other languages back to English
    Object.assign(dictionary, reverseTranslations.hi, reverseTranslations.ta, reverseTranslations.mr);
  } else {
    // Map English to targetLang
    Object.assign(dictionary, translations[targetLang]);
    // Map other languages to targetLang via English
    for (const lang of ['hi', 'ta', 'mr']) {
      if (lang === targetLang) continue;
      const otherToEn = reverseTranslations[lang];
      for (const [otherStr, enStr] of Object.entries(otherToEn)) {
        dictionary[otherStr] = translations[targetLang][enStr] || enStr;
      }
    }
  }

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
    document.documentElement.lang = language;
    translatePage(language);
    const observer = new MutationObserver(() => translatePage(language));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(() => {
    const langs = ['en', 'hi', 'ta', 'mr'];
    return {
      language,
      lang: language,
      isHindi: language === "hi", // kept for backwards compatibility if used elsewhere
      toggleLanguage: () => {
        setLanguage(current => {
          const idx = langs.indexOf(current);
          return langs[(idx + 1) % langs.length];
        });
      },
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
