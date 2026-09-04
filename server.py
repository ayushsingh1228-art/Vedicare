from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import ipaddress
import logging
import uuid
import httpx
import jwt
import bcrypt
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, timedelta

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
except ImportError:
    LlmChat = None
    UserMessage = None

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT config
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRES_HOURS = 24 * 7

# LLM
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# Email
EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ['EMERGENT_EMAIL_KEY']
EMAIL_FROM_NAME = os.environ['EMAIL_FROM_NAME']
EMAIL_REPLY_TO = os.environ.get('EMAIL_REPLY_TO')

OWNER_EMAIL = os.environ.get('OWNER_EMAIL', 'ayushsingh12rock@gmail.com')

app = FastAPI(title="Vediccare API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ------------------- Models -------------------
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "patient"  # patient | doctor
    specialization: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    role: str
    specialization: Optional[str] = None
    is_verified: Optional[bool] = False


class UserVerifyUpdate(BaseModel):
    is_verified: bool


class ChatMessageIn(BaseModel):
    message: str
    session_id: Optional[str] = None


class AppointmentCreate(BaseModel):
    doctor_id: str
    date: str  # ISO date
    time: str  # HH:MM
    reason: Optional[str] = ""


class AppointmentUpdate(BaseModel):
    status: str  # approved | rejected | pending


class HealthRecordCreate(BaseModel):
    title: str
    record_type: str  # prescription | lab_report | discharge_summary | other
    date: str
    notes: Optional[str] = ""
    doctor_name: Optional[str] = ""
    image_url: Optional[str] = None
    is_serious: Optional[bool] = False


class RecordSeriousToggle(BaseModel):
    is_serious: bool


class DoctorConditionCreate(BaseModel):
    title: str
    condition: str            # free-text diagnosis / condition
    severity: str = "moderate"  # mild | moderate | severe | critical
    notes: Optional[str] = ""
    is_serious: Optional[bool] = False


class MedicineCreate(BaseModel):
    name: str
    dosage: str
    times: List[str]  # e.g. ["08:00", "20:00"]
    start_date: str
    end_date: Optional[str] = None
    notes: Optional[str] = ""


class MarkTakenIn(BaseModel):
    time: str
    date: str


# ------------------- Auth helpers -------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False


def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRES_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)):
    if not creds:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        user_id = payload.get("user_id")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_doctor(user=Depends(get_current_user)):
    if user["role"] != "doctor":
        raise HTTPException(status_code=403, detail="Doctors only")
    return user


async def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access only")
    return user


# ------------------- Email helpers (Resend playbook) -------------------
_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str) -> Optional[str]:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if EMAIL_REPLY_TO:
        payload["contact_email"] = EMAIL_REPLY_TO
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            resp = await c.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except Exception as e:
        logger.error(f"Email send error: {e}")
        return None


# ------------------- Auth routes -------------------
@api_router.post("/auth/register")
async def register(data: UserRegister):
    if data.role not in ("patient", "doctor"):
        raise HTTPException(status_code=400, detail="Invalid role")
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email.lower(),
        "password": hash_password(data.password),
        "role": data.role,
        "specialization": data.specialization or ("Ayurvedic Physician" if data.role == "doctor" else None),
        "is_verified": True,
        "login_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_token(user_id, data.role)
    return {"token": token, "user": {"id": user_id, "name": data.name, "email": data.email.lower(), "role": data.role, "specialization": doc["specialization"], "is_verified": True}}


@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    login_count = int(user.get("login_count", 0)) + 1
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": user["id"]}, {"$set": {"login_count": login_count, "last_login_at": now}})

    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"], "specialization": user.get("specialization"), "is_verified": True, "login_count": login_count}}


@api_router.post("/auth/demo")
async def demo_login():
    """Return a token for the pre-seeded demo patient."""
    user = await db.users.find_one({"email": "demo@vediccare.app"})
    if not user:
        raise HTTPException(status_code=500, detail="Demo user not seeded")
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}}


@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ------------------- Doctors -------------------
@api_router.get("/doctors")
async def list_doctors(user=Depends(get_current_user)):
    docs = await db.users.find({"role": "doctor", "is_verified": True}, {"_id": 0, "password": 0}).to_list(200)
    return docs


@api_router.get("/admin/stats")
async def admin_stats(user=Depends(require_admin)):
    total_users = await db.users.count_documents({})
    total_patients = await db.users.count_documents({"role": "patient"})
    total_doctors = await db.users.count_documents({"role": "doctor"})
    verified_users = await db.users.count_documents({"is_verified": True})
    pending_users = await db.users.count_documents({"role": {"$in": ["patient", "doctor"]}, "is_verified": False})
    total_logins = await db.users.aggregate([
        {"$group": {"_id": None, "total": {"$sum": {"$ifNull": ["$login_count", 0]}}}}
    ]).to_list()
    return {
        "total_users": total_users,
        "total_patients": total_patients,
        "total_doctors": total_doctors,
        "verified_users": verified_users,
        "pending_users": pending_users,
        "total_logins": total_logins[0]["total"] if total_logins else 0,
    }


@api_router.get("/admin/users")
async def admin_users(user=Depends(require_admin)):
    items = await db.users.find({}, {"_id": 0, "password": 0}).sort("created_at", -1).to_list(500)
    return items


@api_router.patch("/admin/users/{user_id}/verify")
async def admin_verify_user(user_id: str, data: UserVerifyUpdate, user=Depends(require_admin)):
    result = await db.users.update_one({"id": user_id}, {"$set": {"is_verified": data.is_verified}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "ok", "is_verified": data.is_verified}


# ------------------- Chatbot -------------------
def fallback_chat_reply(message: str, user_name: str = "there") -> str:
    """Provide useful Ayurvedic guidance when the LLM is unavailable."""
    lower = message.lower()
    hindi = bool(re.search(r"[\u0900-\u097f]", message))
    
    # Hindi responses with Ayurvedic wisdom
    if hindi:
        # Sleep & Rest (Nidra)
        if any(word in lower for word in ("नींद", "सोना", "अनिद्रा", "नींद न आना")):
            return (
                f"{user_name}, आयुर्वेद में नींद को 'त्रिउपस्तंभ' (जीवन के तीन स्तंभ) में से एक माना जाता है। \n\n"
                "**बेहतर नींद के लिए:**\n"
                "• रात 10 बजे तक सोने जाएं (पित्त शांति के लिए)\n"
                "• सोने से 1 घंटे पहले गर्म दूध में घी डालकर पिएं\n"
                "• सोने से 30 मिनट पहले स्क्रीन से दूर रहें\n"
                "• नियमित दिनचर्या (दिनचर्या) बनाएं\n"
                "• शाम को तेल की मालिश करें (अभ्यंग)\n\n"
                "क्या आपको रात में जागने की समस्या है या सोना मुश्किल हो रहा है?"
            )
        
        # Stress & Anxiety (Vata Imbalance)
        if any(word in lower for word in ("तनाव", "चिंता", "घबराहट", "बेचैनी")):
            return (
                f"{user_name}, तनाव आमतौर पर वात की असंतुलन का संकेत है। \n\n"
                "**तुरंत राहत के लिए:**\n"
                "• नाड़ी शोधन प्राणायाम: 5 मिनट (बाएं नथुने से सांस लें, दाएं से छोड़ें)\n"
                "• ध्यान: रोज 10 मिनट शांत बैठें\n"
                "• गर्म अरंडी का तेल माथे पर लगाएं\n"
                "• गर्म पानी में नींबू और शहद पिएं\n\n"
                "**दीर्घकालिक संतुलन के लिए:**\n"
                "• गर्म, पचने में आसान भोजन करें\n"
                "• नियमित दिनचर्या रखें\n"
                "• अश्वगंधा या ब्राह्मी का उपयोग करें (डॉक्टर से पूछें)\n\n"
                "क्या तनाव किसी विशेष कारण से है?"
            )
        
        # Digestion (Agni)
        if any(word in lower for word in ("पाचन", "कब्ज", "एसिडिटी", "गैस", "पेट दर्द")):
            return (
                f"{user_name}, पाचन आयुर्वेद का मूल आधार है। \n\n"
                "**अग्नि (पाचक शक्ति) को मजबूत करने के लिए:**\n"
                "• खाना धीरे-धीरे, अच्छी तरह चबाकर खाएं\n"
                "• दिन के मध्य में मुख्य भोजन करें (पित्त के समय)\n"
                "• भोजन के बाद गुनगुना पानी पिएं\n"
                "• अदरक की चाय दिन में 2 बार लें\n"
                "• मैदा और तली हुई चीजें कम करें\n"
                "• सुबह खाली पेट गुनगुना पानी पिएं\n\n"
                "**कब्ज के लिए:** रात को गर्म दूध में घी मिलाकर पिएं।\n"
                "**एसिडिटी के लिए:** दही और ठंडे दूध से बचें।\n\n"
                "समस्या बनी रहे तो आयुर्वेदिक डॉक्टर से मिलें।"
            )
        
        # Energy & Vitality (Ojas)
        if any(word in lower for word in ("थकान", "कमजोरी", "ऊर्जा", "शक्ति", "दुर्बलता")):
            return (
                f"{user_name}, कम ऊर्जा अक्सर असंतुलित दिनचर्या और पाचन से जुड़ी होती है। \n\n"
                "**ऊर्जा बढ़ाने के लिए:**\n"
                "• सुबह 6 बजे उठें और धूप में 15 मिनट बैठें\n"
                "• गर्म दूध में शहद, घी और मेवे मिलाकर नाश्ते में लें\n"
                "• नारियल का पानी या छाछ दोपहर में पिएं\n"
                "• शाम को तेल की मालिश करें\n"
                "• रातभर काम करने से बचें\n"
                "• तिल, अलसी और बादाम खाएं\n"
                "• हल्का-फुल्का व्यायाम या योग करें\n\n"
                "यदि यह 3 सप्ताह से ज्यादा है, तो अपने डॉक्टर को देखें।"
            )
        
        # Skin & Immunity (Tejas)
        if any(word in lower for word in ("त्वचा", "खुजली", "दाने", "मुंहासे", "रोग प्रतिरोधक", "प्रतिरक्षा")):
            return (
                f"{user_name}, स्वस्थ त्वचा और रोग प्रतिरोधक क्षमता शुद्ध आहार से आती है। \n\n"
                "**त्वचा और प्रतिरक्षा के लिए:**\n"
                "• दिन में 2 बार नारियल तेल से त्वचा पर मालिश करें\n"
                "• हरी सब्जियां, दाल और घी खाएं\n"
                "• हल्दी दूध रोज रात को पिएं\n"
                "• ठंडे पानी और कोल्ड ड्रिंक्स से बचें\n"
                "• तेल के बिना घर का खाना खाएं\n"
                "• सुबह ब्रश के बाद अपनी जीभ को स्क्रेप करें (जिह्वा निर्लेखन)\n"
                "• रात में जल्दी सोएं\n\n"
                "गंभीर मुंहासे या खुजली के लिए त्वचा विशेषज्ञ या आयुर्वेदिक डॉक्टर से मिलें।"
            )
        
        # Emotions & Mental Clarity
        if any(word in lower for word in ("दुखी", "उदास", "अकेला", "परेशान", "भूलना", "ध्यान")):
            return (
                f"{user_name}, भावनात्मक संतुलन शारीरिक स्वास्थ्य का एक महत्वपूर्ण हिस्सा है। \n\n"
                "**मानसिक शांति के लिए:**\n"
                "• 15 मिनट रोज ध्यान करें\n"
                "• दिन में 3-4 बार गहरी सांस लें (पूर्ण श्वास)\n"
                "• सुगंधित तेलों का उपयोग करें (गुलाब, चंदन)\n"
                "• प्रिय व्यक्तियों के साथ समय बिताएं\n"
                "• बगीचे में टहलें या प्रकृति में समय बिताएं\n"
                "• मंत्र या भजन सुनें\n\n"
                "यदि उदासी या अकेलापन लंबे समय तक रहता है, तो किसी मानसिक स्वास्थ्य पेशेवर से बात करें।"
            )
        
        # Dosha Information
        if any(word in lower for word in ("दोष", "वात", "पित्त", "कफ", "कौन सा दोष")):
            return (
                f"{user_name}, तीन दोष आयुर्वेद की नींव हैं:\n\n"
                "**वात (वायु + आकाश):** हल्का, सूखा, ठंडा\n"
                "लक्षण: पतलापन, चिंता, अनिद्रा, कब्ज\n"
                "संतुलन: गर्म, तैलीय भोजन, नियमित दिनचर्या\n\n"
                "**पित्त (अग्नि + जल):** तीव्र, गर्म, तीक्ष्ण\n"
                "लक्षण: जल्दी गुस्सा, एसिडिटी, अत्यधिक पसीना\n"
                "संतुलन: ठंडे, हल्के भोजन, शीतलता से भरपूर\n\n"
                "**कफ (पृथ्वी + जल):** भारी, नम, स्थिर\n"
                "लक्षण: सुस्ती, वजन बढ़ना, बलगम\n"
                "संतुलन: गर्म, हल्का भोजन, गतिविधि बढ़ाएं\n\n"
                "अपना व्यक्तिगत दोष जानने के लिए हमारे डॉक्टर से परामर्श लें।"
            )
        
        # Seasonal Routine (Ritucharya)
        if any(word in lower for word in ("मौसम", "ऋतु", "गर्मी", "सर्दी", "बारिश")):
            return (
                f"{user_name}, हर ऋतु के लिए आयुर्वेद का अपना दिनचर्या है। \n\n"
                "**गर्मी (गीष्म):**\n"
                "• ठंडा दूध, नारियल का पानी, खीरा खाएं\n"
                "• दोपहर में बाहर न निकलें\n"
                "• रेशम के कपड़े पहनें\n\n"
                "**सर्दी (शीत):**\n"
                "• गर्म दूध, तिल, घी खाएं\n"
                "• सूरज में बैठें\n"
                "• तेल की मालिश बढ़ाएं\n\n"
                "**बारिश (वर्षा):**\n"
                "• पचने में आसान भोजन करें\n"
                "• कच्ची सब्जियों से बचें\n"
                "• पानी उबालकर पिएं\n\n"
                "अधिक जानकारी के लिए हमारे आयुर्वेदिक डॉक्टर से मिलें।"
            )
        
        # Billing
        if any(word in lower for word in ("बिल", "खर्च", "कीमत", "भुगतान", "इनवॉयस", "शुल्क")):
            return (
                f"{user_name}, मैं आपके बिल के बारे में सामान्य जानकारी दे सकता हूं। \n\n"
                "**वेदिकेयर में सामान्य शुल्क:**\n"
                "• परामर्श शुल्क: ₹200–₹800 (चिकित्सक और सत्र के प्रकार के आधार पर)\n"
                "• प्रयोगशाला रिपोर्ट: ₹100–₹2,000 (परीक्षण के प्रकार के आधार पर)\n"
                "• पंचकर्म सत्र: ₹1,500–₹5,000 प्रति सत्र\n\n"
                "**अपने विशिष्ट बिल के लिए:**\n"
                "• वेदिकेयर के बिलिंग विभाग से संपर्क करें\n"
                "• अपने डॉक्टर की क्लिनिक को कॉल करें\n"
                "• किसी विशिष्ट शुल्क के बारे में पूछें\n\n"
                "क्या मैं किसी विशेष चीज़ को समझाने में आपकी मदद कर सकता हूं?"
            )
        
        # Default Hindi response
        return (
            f"{user_name}, मैं आपके स्वास्थ्य और आयुर्वेदिक कल्याण में आपकी मदद करने यहां हूं। \n\n"
            "**मैं आपको सहायता दे सकता हूं:**\n"
            "• दोष और व्यक्तिगत संविधान\n"
            "• नींद, तनाव और पाचन सुधार\n"
            "• मौसमी दिनचर्या और दैनिक दिनचर्या\n"
            "• त्वचा, ऊर्जा और प्रतिरक्षा\n"
            "• आयुर्वेदिक जड़ी-बूटियां और उपचार\n"
            "• बिलिंग प्रश्न\n\n"
            "कृपया अपना प्रश्न थोड़ा अधिक विस्तार से बताएं। ध्यान दें: यह सामान्य जानकारी है, डॉक्टर की सलाह नहीं।"
        )
    
    # English responses with Ayurvedic wisdom
    # Sleep & Rest (Nidra)
    if any(word in lower for word in ("sleep", "insomnia", "tired", "sleepy", "rest")):
        return (
            f"{user_name}, Ayurveda considers sleep one of the three pillars of life. Here's how to improve it:\n\n"
            "**For better sleep:**\n"
            "• Sleep by 10 PM (pitta pacification time)\n"
            "• Drink warm milk with ghee 30 minutes before bed\n"
            "• Avoid screens 1 hour before sleep\n"
            "• Maintain a consistent sleep schedule (dinacharya)\n"
            "• Try abhyanga (oil massage) in the evening\n"
            "• Keep your bedroom cool and dark\n\n"
            "**Try this:** Nadi Shodhana pranayama (alternate nostril breathing) for 5 minutes before bed.\n\n"
            "Are you waking up during the night, or is it hard to fall asleep?"
        )
    
    # Stress & Anxiety
    if any(word in lower for word in ("stress", "anxiety", "worry", "tense", "overwhelmed")):
        return (
            f"{user_name}, stress often indicates Vata imbalance. Here's Ayurvedic support:\n\n"
            "**Immediate relief:**\n"
            "• Nadi Shodhana: Breathe in through left nostril, out through right (5 minutes)\n"
            "• Meditation: 10 minutes daily in silence\n"
            "• Massage sesame oil on your forehead\n"
            "• Sip warm water with lemon and honey\n\n"
            "**Long-term balance:**\n"
            "• Eat warm, easy-to-digest foods\n"
            "• Follow a consistent daily routine\n"
            "• Consider Ashwagandha or Brahmi (consult your doctor)\n"
            "• Spend time in nature\n\n"
            "If stress persists, speak with a mental health professional. What's troubling you most?"
        )
    
    # Digestion & Gut Health
    if any(word in lower for word in ("digestion", "constipation", "acidity", "gas", "bloating", "stomach")):
        return (
            f"{user_name}, strong digestion (Agni) is central to Ayurvedic health:\n\n"
            "**Strengthen your digestive fire:**\n"
            "• Chew slowly and thoroughly\n"
            "• Eat your largest meal at midday (Pitta time)\n"
            "• Drink warm water after meals\n"
            "• Have ginger tea twice daily\n"
            "• Avoid fried and processed foods\n"
            "• Drink warm water on an empty stomach each morning\n\n"
            "**For constipation:** Warm milk with ghee before bed\n"
            "**For acidity:** Avoid yogurt and cold milk\n"
            "**For bloating:** Eat in a calm environment without distractions\n\n"
            "If this continues for 3+ weeks, consult your Ayurvedic doctor."
        )
    
    # Energy & Vitality
    if any(word in lower for word in ("fatigue", "energy", "weakness", "tired", "weak", "exhausted")):
        return (
            f"{user_name}, low energy often comes from Vata imbalance and poor digestion:\n\n"
            "**Boost your vitality (Ojas):**\n"
            "• Wake at 6 AM and sit in sunlight for 15 minutes\n"
            "• Have warm milk with honey, ghee, and nuts for breakfast\n"
            "• Drink coconut water or buttermilk at midday\n"
            "• Do oil massage (abhyanga) in the evening\n"
            "• Avoid late-night work and late dinners\n"
            "• Eat sesame, flaxseed, and almonds regularly\n"
            "• Try gentle yoga or light exercise\n\n"
            "**Key:** Consistent routine is essential. If fatigue lasts 3+ weeks, see your doctor.\n\n"
            "What's your typical daily routine like?"
        )
    
    # Skin & Immunity
    if any(word in lower for word in ("skin", "immunity", "rash", "itching", "pimple", "acne", "immune")):
        return (
            f"{user_name}, healthy skin and strong immunity come from pure food and balanced digestion:\n\n"
            "**For glowing skin and immunity:**\n"
            "• Massage coconut oil on skin twice daily\n"
            "• Eat plenty of green vegetables, lentils, and ghee\n"
            "• Drink warm turmeric milk every evening (golden milk)\n"
            "• Avoid cold water and sugary drinks\n"
            "• Eat home-cooked, oil-light meals\n"
            "• Tongue scraping each morning (jivha nirlekhana)\n"
            "• Sleep by 10 PM consistently\n\n"
            "**Anti-inflammatory herbs:** Turmeric, neem, and ashwagandha support both skin and immunity.\n\n"
            "For persistent skin issues, consult an Ayurvedic practitioner or dermatologist."
        )
    
    # Emotions & Mental Clarity
    if any(word in lower for word in ("sad", "lonely", "upset", "depressed", "mental", "mood", "brain fog")):
        return (
            f"{user_name}, emotional balance is inseparable from physical health in Ayurveda:\n\n"
            "**For mental clarity and peace:**\n"
            "• Meditate for 15 minutes daily\n"
            "• Practice full deep breathing 3-4 times daily\n"
            "• Use aromatic oils: rose, sandalwood, lavender\n"
            "• Spend time with loved ones\n"
            "• Walk in nature or a garden\n"
            "• Listen to mantras or devotional music\n"
            "• Avoid overstimulation (news, screens)\n\n"
            "**Remember:** You are not alone. If sadness or loneliness persists for weeks, "
            "please reach out to a mental health professional or a trusted person.\n\n"
            "What would help you feel more grounded right now?"
        )
    
    # Dosha Information
    if any(word in lower for word in ("dosha", "vata", "pitta", "kapha", "constitution", "type")):
        return (
            f"{user_name}, understanding your dosha (constitution) is key to Ayurvedic wellness:\n\n"
            "**Vata (Air + Ether):** Light, dry, cold\n"
            "Signs: Slenderness, anxiety, insomnia, constipation\n"
            "Balance: Warm, oily foods; consistent routine; grounding activities\n\n"
            "**Pitta (Fire + Water):** Sharp, hot, intense\n"
            "Signs: Strong digestion, quick temper, acidity, excessive sweating\n"
            "Balance: Cool, light foods; coolness; moderation in all things\n\n"
            "**Kapha (Earth + Water):** Heavy, damp, stable\n"
            "Signs: Sturdiness, lethargy, weight gain, sluggish digestion\n"
            "Balance: Warm, light foods; exercise; stimulating activities\n\n"
            "To discover your unique dosha combination, consult one of our Ayurvedic doctors."
        )
    
    # Seasonal Routine
    if any(word in lower for word in ("season", "seasonal", "spring", "summer", "fall", "winter", "season", "ritual", "routine")):
        return (
            f"{user_name}, Ayurveda emphasizes seasonal routines (Ritucharya) for optimal health:\n\n"
            "**Summer (Hot Season):**\n"
            "• Cool beverages: coconut water, sweet lassi, fresh juices\n"
            "• Light vegetables and cooling herbs\n"
            "• Avoid midday sun; rest during 12-4 PM\n"
            "• Wear light, breathable clothing\n\n"
            "**Winter (Cold Season):**\n"
            "• Warm milk, sesame oil, ghee-rich foods\n"
            "• Sunbathing and increased oil massage\n"
            "• Warming spices: ginger, cinnamon, cardamom\n"
            "• Earlier bedtime to align with shorter days\n\n"
            "**Monsoon (Rainy Season):**\n"
            "• Light, easy-to-digest foods\n"
            "• Boiled or filtered water only\n"
            "• Avoid raw vegetables\n"
            "• Maintain a consistent routine\n\n"
            "Seasonal adjustments prevent imbalance. Which season are you in now?"
        )
    
    # Billing & Invoices
    if any(word in lower for word in ("bill", "invoice", "charge", "fee", "cost", "price", "payment", "receipt", "billing", "refund")):
        return (
            f"{user_name}, I can help with general billing questions. Here's typical Vediccare pricing:\n\n"
            "• **Consultation fee:** ₹200–₹800 (depending on physician and session type)\n"
            "• **Lab reports:** ₹100–₹2,000 (varies by test)\n"
            "• **Panchakarma sessions:** ₹1,500–₹5,000 per session\n"
            "• **Follow-up consultations:** ₹150–₹600\n\n"
            "**For your specific invoice:**\n"
            "Contact Vediccare's billing department or call your doctor's clinic directly. "
            "They can explain each line item and help with any disputes.\n\n"
            "Is there a particular charge on your bill you'd like me to explain?"
        )
    
    # Default English response
    return (
        f"{user_name}, I'm here to support your wellness journey through Ayurvedic wisdom and modern healthcare:\n\n"
        "**I can help with:**\n"
        "• Your unique constitution (dosha) and how to balance it\n"
        "• Sleep, stress, digestion, and energy issues\n"
        "• Seasonal routines and daily self-care practices\n"
        "• Skin health, immunity, and emotional well-being\n"
        "• Ayurvedic herbs, therapies, and treatments\n"
        "• Billing questions and appointment scheduling\n\n"
        "Tell me a bit more about what's on your mind. Remember, "
        "this is general wellness guidance—always consult your doctor for medical concerns."
    )


@api_router.post("/chat")
async def chat(data: ChatMessageIn, user=Depends(get_current_user)):
    session_id = data.session_id or f"{user['id']}-default"
    system_msg = (
        "You are Vediccare AI, a compassionate wellness companion blending evidence-based healthcare with authentic "
        "Ayurvedic wisdom. Your role is to empower patients toward holistic well-being through personalized guidance "
        "rooted in India's ancient healing tradition.\n\n"
        
        "AYURVEDIC FOUNDATION:\n"
        "• The 3 DOSHAS (constitutional energies):\n"
        "  - VATA (Air + Ether): Governs movement, creativity, nervous system. Imbalance: anxiety, insomnia, constipation\n"
        "  - PITTA (Fire + Water): Governs digestion, metabolism, transformation. Imbalance: inflammation, anger, acidity\n"
        "  - KAPHA (Earth + Water): Governs stability, structure, immunity. Imbalance: lethargy, heaviness, congestion\n"
        "• Balance comes from DINACHARYA (daily routine), RITUCHARYA (seasonal adaptation), and AHARA (right diet).\n"
        "• OJAS (vital immunity) is strengthened through rest, love, and nourishment.\n"
        "• AGNI (digestive fire) is the foundation of health; when weak, all diseases arise.\n\n"
        
        "YOUR EXPERTISE:\n"
        "1. WELLNESS & LIFESTYLE: Sleep (Nidra), stress, digestion (Agni), energy (Ojas), emotional balance, immunity, "
        "skin health, herbal remedies, yoga, pranayama, meditation, Panchakarma, seasonal health routines.\n"
        "2. DOSHA-AWARE GUIDANCE: Help users understand their constitution and provide personalized diet and lifestyle "
        "recommendations. Always caveat that deep dosha analysis requires a full consultation.\n"
        "3. BILLING & APPOINTMENTS: Explain Vediccare's typical fees (consultation ₹200-₹800, lab tests ₹100-₹2000, "
        "Panchakarma ₹1500-₹5000). For specific invoices, direct them to billing support. Help with appointment logistics.\n"
        "4. HEALTH RECORDS: Advise on what records to maintain, how to prepare for consultations.\n"
        "5. SYMPTOM SUPPORT: Offer gentle, evidence-backed guidance for common concerns (poor sleep, anxiety, digestion, fatigue, "
        "weak immunity). Always emphasize this is wellness support, not diagnosis or treatment.\n\n"
        
        "TONE & VALUES:\n"
        "• WARM & REASSURING: Validate concerns; create a safe space for questions.\n"
        "• PRACTICAL: Give actionable steps patients can do today (warm milk, breathing, routines).\n"
        "• HUMBLE: Acknowledge the limits of online guidance. Recommend professional consultation for serious issues.\n"
        "• CULTURALLY ROOTED: Use Ayurvedic terms (Nadi Shodhana, Abhyanga, Agni, Ojas) with respectful explanation.\n"
        "• EVIDENCE-AWARE: Ground advice in both traditional wisdom and modern wellness science.\n\n"
        
        "CRITICAL GUIDELINES:\n"
        "• NEVER diagnose or prescribe medicine. Say 'Consult your Ayurvedic doctor or physician' for specific treatments.\n"
        "• MENTAL HEALTH: For anxiety/depression lasting weeks, always recommend a qualified mental health professional.\n"
        "• BILLING: Only provide general pricing. Always redirect specific invoice disputes to billing@vediccare.com or their doctor.\n"
        "• EMERGENCY: If user mentions chest pain, severe bleeding, or suicidal thoughts, advise immediate emergency services.\n"
        "• LANGUAGES: Respond in the user's language (English or Hindi). Use proper Unicode for Hindi.\n\n"
        
        "RESPONSE STRUCTURE:\n"
        "For wellness topics: (1) Acknowledge their concern, (2) Explain the Ayurvedic perspective, (3) Give 3-5 specific, "
        "doable practices, (4) Ask a follow-up question to deepen understanding.\n"
        "For billing/appointments: Quick facts + direct to the right department.\n"
        "For complex queries: Offer Ayurvedic insights + recommend a consultation.\n\n"
        
        "REMEMBER: You represent Vediccare's commitment to bringing Ayurveda into modern wellness. Be the warm, "
        "knowledgeable friend every patient deserves. Always close with compassion and hope."
    )
    if LlmChat is None:
        reply = fallback_chat_reply(data.message, user["name"].split(" ")[0])
    else:
        llm = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_msg,
        ).with_model("gemini", "gemini-2.0-flash")
        try:
            reply = await llm.send_message(UserMessage(text=data.message))
        except Exception as e:
            logger.error(f"LLM error: {e}")
            reply = fallback_chat_reply(data.message, user["name"].split(" ")[0])

    now = datetime.now(timezone.utc).isoformat()
    await db.chat_messages.insert_many([
        {"id": str(uuid.uuid4()), "user_id": user["id"], "session_id": session_id, "role": "user", "content": data.message, "created_at": now},
        {"id": str(uuid.uuid4()), "user_id": user["id"], "session_id": session_id, "role": "assistant", "content": reply, "created_at": now},
    ])
    return {"reply": reply, "session_id": session_id}


@api_router.get("/chat/history")
async def chat_history(user=Depends(get_current_user)):
    session_id = f"{user['id']}-default"
    msgs = await db.chat_messages.find({"session_id": session_id}, {"_id": 0}).sort("created_at", 1).to_list(500)
    return msgs


# ------------------- Wellness Guidance -------------------
class WellnessQueryIn(BaseModel):
    condition: str
    language: Optional[str] = "en"


def get_wellness_guidance(condition: str, lang: str = "en") -> dict:
    """Provide Ayurvedic wellness guidance for common conditions."""
    lower = condition.lower().strip()
    
    # Comprehensive wellness guidance database
    wellness_db = {
        # Headache
        "headache": {
            "en": {
                "interpretation": "Headaches often signal an imbalance in Vata (stress, poor sleep) or Pitta (excess heat, overwork). A few gentle steps can help.",
                "lifestyle": [
                    "Rest in a cool, quiet space for 15 minutes",
                    "Apply cool coconut or sesame oil to the forehead and temples",
                    "Sip warm water with lemon and honey",
                    "Practice slow, deep breathing (Nadi Shodhana) for 5 minutes",
                    "Avoid bright screens and stimulating foods"
                ],
                "timeline": "Most mild headaches ease within 24 hours with rest. If pain persists beyond 48 hours or is severe, consult a doctor."
            },
            "hi": {
                "interpretation": "सिरदर्द आमतौर पर वात (तनाव, खराब नींद) या पित्त (अतिरिक्त गर्मी, ज्यादा काम) के असंतुलन का संकेत है। कुछ कोमल कदम मदद कर सकते हैं।",
                "lifestyle": [
                    "ठंडी, शांत जगह में 15 मिनट आराम करें",
                    "माथे और कनपटियों पर ठंडा नारियल या तिल का तेल लगाएं",
                    "नींबू और शहद के साथ गुनगुना पानी पिएं",
                    "धीमी, गहरी सांस लें (नाड़ी शोधन) 5 मिनट के लिए",
                    "तेज रोशनी और उत्तेजक खाने से बचें"
                ],
                "timeline": "अधिकांश हल्के सिरदर्द आराम के साथ 24 घंटे में कम हो जाते हैं। यदि दर्द 48 घंटे से अधिक बना रहता है या गंभीर है, तो डॉक्टर से मिलें।"
            }
        },
        # Acidity
        "acidity": {
            "en": {
                "interpretation": "Acidity reflects weak digestive fire (Agni), often from rushed eating, spicy food, or stress. Cooling and calming your digestion is key.",
                "lifestyle": [
                    "Eat slowly, chew thoroughly—no rushing or eating while stressed",
                    "Sip room-temperature or warm water (not cold) throughout the day",
                    "Have your biggest meal at midday when Pitta is naturally strong",
                    "Drink plain lassi or warm milk with a pinch of cumin after meals",
                    "Avoid spicy, oily, and fried foods for 3–5 days",
                    "Sleep on your left side to ease digestion"
                ],
                "timeline": "Acidity often improves within 2–3 days of dietary changes. If it returns frequently or persists beyond a week, see a doctor to rule out other causes."
            },
            "hi": {
                "interpretation": "एसिडिटी कमजोर पाचन अग्नि (अग्नि) को दर्शाती है, अक्सर जल्दबाजी से खाना, मसालेदार खाना, या तनाव से। अपने पाचन को ठंडा और शांत करना महत्वपूर्ण है।",
                "lifestyle": [
                    "धीरे-धीरे खाएं, अच्छी तरह चबाएं—कोई जल्दबाजी या तनाव में खाना नहीं",
                    "पूरे दिन कमरे के तापमान या गुनगुना पानी (ठंडा नहीं) पिएं",
                    "दोपहर को अपना सबसे बड़ा भोजन करें जब पित्त स्वाभाविक रूप से मजबूत हो",
                    "भोजन के बाद सादा लस्सी या जीरे की एक चुटकी के साथ गुनगुना दूध पिएं",
                    "3–5 दिनों के लिए मसालेदार, तैलीय और तली हुई चीजों से बचें",
                    "पाचन को आसान करने के लिए अपने बाईं ओर सोएं"
                ],
                "timeline": "एसिडिटी अक्सर आहार परिवर्तन के 2-3 दिनों में सुधरती है। यदि यह बार-बार लौटता है या एक सप्ताह से अधिक बना रहता है, तो अन्य कारणों को नियंत्रित करने के लिए डॉक्टर को देखें।"
            }
        },
        # Stress
        "stress": {
            "en": {
                "interpretation": "Stress signals Vata imbalance. Your nervous system needs grounding, stillness, and reassurance. Ayurveda has gentle tools for this.",
                "lifestyle": [
                    "Practice 5 minutes of Nadi Shodhana (alternate nostril breathing) in the morning",
                    "Meditate or sit quietly for 10 minutes daily—no pressure to 'do it right'",
                    "Apply warm oil to your head and body (abhyanga) in the evening",
                    "Drink warm milk with cardamom or ashwagandha (if your doctor approves) before bed",
                    "Maintain a consistent daily routine: same wake/sleep times, meals at regular hours",
                    "Limit caffeine and heavy, processed foods"
                ],
                "timeline": "With consistent practice, most people notice calmer energy within 1–2 weeks. If stress feels overwhelming or doesn't ease, talk to a mental health professional."
            },
            "hi": {
                "interpretation": "तनाव वात असंतुलन का संकेत है। आपकी तंत्रिका तंत्र को स्थिरता, शांति और आश्वासन की जरूरत है। आयुर्वेद के पास इसके लिए कोमल उपकरण हैं।",
                "lifestyle": [
                    "सुबह नाड़ी शोधन (वैकल्पिक नाथुने की सांस) का 5 मिनट अभ्यास करें",
                    "रोज 10 मिनट ध्यान करें या शांति से बैठें—'सही तरीके' से करने का दबाव नहीं",
                    "शाम को अपने सिर और शरीर पर गर्म तेल लगाएं (अभ्यंग)",
                    "सोने से पहले इलायची या अश्वगंधा के साथ गुनगुना दूध पिएं (यदि आपके डॉक्टर ने मंजूरी दी हो)",
                    "एक सुसंगत दैनिक दिनचर्या बनाए रखें: एक ही समय पर जागना/सोना, नियमित समय पर भोजन",
                    "कैफीन और भारी, प्रसंस्कृत खाद्य पदार्थों को सीमित करें"
                ],
                "timeline": "नियमित अभ्यास के साथ, अधिकांश लोग 1-2 सप्ताह में शांत ऊर्जा देखते हैं। यदि तनाव भारी महसूस हो या कम न हो, तो मानसिक स्वास्थ्य पेशेवर से बात करें।"
            }
        },
        # Joint Pain
        "joint pain": {
            "en": {
                "interpretation": "Joint pain often comes from Vata imbalance (cold, dry, rough). Warmth, oil, and gentle movement restore ease.",
                "lifestyle": [
                    "Apply warm sesame or mustard oil to the painful joint; massage gently for 5–10 minutes",
                    "Soak in warm water with a pinch of salt for 10–15 minutes daily",
                    "Eat warming, grounding foods: soups, stews, whole grains, healthy fats",
                    "Try gentle, slow yoga or tai chi—avoid high-impact exercise",
                    "Keep warm; avoid cold showers and cold environments",
                    "Stay hydrated with warm water throughout the day"
                ],
                "timeline": "Many people experience relief within 3–5 days with consistent oil massage and warmth. If pain worsens, spreads, or limits movement significantly, see a doctor."
            },
            "hi": {
                "interpretation": "जोड़ों का दर्द अक्सर वात असंतुलन (ठंड, सूखापन, खुरदरापन) से आता है। गर्मी, तेल, और कोमल गति आराम बहाल करती है।",
                "lifestyle": [
                    "दर्दनाक जोड़ पर गर्म तिल या सरसों का तेल लगाएं; 5-10 मिनट के लिए धीरे से मालिश करें",
                    "नमक की एक चुटकी के साथ गर्म पानी में रोज 10-15 मिनट के लिए भिगोएं",
                    "गर्म, जमीन वाले खाद्य पदार्थ खाएं: सूप, स्टू, साबुत अनाज, स्वस्थ वसा",
                    "कोमल, धीमा योग या ताई ची आजमाएं—उच्च-प्रभाव व्यायाम से बचें",
                    "गर्म रहें; ठंडे शावर और ठंडे वातावरण से बचें",
                    "पूरे दिन गर्म पानी से हाइड्रेटेड रहें"
                ],
                "timeline": "कई लोग नियमित तेल मालिश और गर्मी के साथ 3-5 दिनों में राहत का अनुभव करते हैं। यदि दर्द बदतर हो, फैल जाए, या गति को महत्वपूर्ण रूप से सीमित करे, तो डॉक्टर को देखें।"
            }
        },
        # Fatigue
        "fatigue": {
            "en": {
                "interpretation": "Persistent tiredness often signals weak digestion (Agni) or Vata excess. Nourishment, rest, and routine restore your natural energy.",
                "lifestyle": [
                    "Sleep by 10 PM and wake by 6 AM—consistency matters more than hours",
                    "Eat warm, well-cooked, easy-to-digest foods at regular times",
                    "Include healthy fats and protein: ghee, sesame oil, lentils, bone broth",
                    "Take 10–15 minute walks in morning sunlight daily",
                    "Do gentle oil massage (abhyanga) in the evening",
                    "Limit screen time after sunset"
                ],
                "timeline": "With steady routine and nourishing food, most people feel more energized within 2–3 weeks. If fatigue is severe or worsens, consult your doctor."
            },
            "hi": {
                "interpretation": "लगातार थकान अक्सर कमजोर पाचन (अग्नि) या वात अधिकता का संकेत है। पोषण, आराम और दिनचर्या आपकी प्राकृतिक ऊर्जा बहाल करती है।",
                "lifestyle": [
                    "रात 10 बजे तक सोएं और सुबह 6 बजे उठें—घंटे से अधिक निरंतरता मायने रखती है",
                    "नियमित समय पर गर्म, अच्छी तरह पकाया हुआ, पचने में आसान भोजन करें",
                    "स्वस्थ वसा और प्रोटीन शामिल करें: घी, तिल का तेल, दाल, हड्डी का शोरबा",
                    "रोज सुबह धूप में 10-15 मिनट की सैर करें",
                    "शाम को कोमल तेल की मालिश (अभ्यंग) करें",
                    "सूर्यास्त के बाद स्क्रीन समय को सीमित करें"
                ],
                "timeline": "स्थिर दिनचर्या और पोषक भोजन के साथ, अधिकांश लोग 2-3 सप्ताह में अधिक ऊर्जावान महसूस करते हैं। यदि थकान गंभीर है या बदतर हो रही है, तो अपने डॉक्टर से परामर्श लें।"
            }
        },
        # Insomnia
        "insomnia": {
            "en": {
                "interpretation": "Sleep troubles usually signal Vata or Pitta imbalance. Your body and mind need calm, consistency, and nourishing foods.",
                "lifestyle": [
                    "Go to bed by 10 PM; aim for 7–9 hours of sleep",
                    "Avoid screens 1 hour before bed; dim the lights",
                    "Drink warm milk with a pinch of nutmeg 30 minutes before sleep",
                    "Practice Nadi Shodhana (5 minutes) or meditation before bed",
                    "Keep your bedroom cool, dark, and quiet",
                    "Avoid caffeine after 2 PM and heavy dinners"
                ],
                "timeline": "Sleep often improves within 1–2 weeks of consistent bedtime routine. If insomnia persists despite these changes, talk to a doctor—sleep disorders need professional care."
            },
            "hi": {
                "interpretation": "नींद की समस्या आमतौर पर वात या पित्त असंतुलन का संकेत है। आपके शरीर और मन को शांति, निरंतरता और पोषक खाद्य पदार्थों की आवश्यकता है।",
                "lifestyle": [
                    "रात 10 बजे तक बिस्तर पर जाएं; 7-9 घंटे की नींद का लक्ष्य रखें",
                    "सोने से 1 घंटे पहले स्क्रीन से बचें; रोशनी कम करें",
                    "सोने से 30 मिनट पहले जायफल की एक चुटकी के साथ गुनगुना दूध पिएं",
                    "सोने से पहले नाड़ी शोधन (5 मिनट) या ध्यान का अभ्यास करें",
                    "अपने बेडरूम को ठंडा, अंधेरा और शांत रखें",
                    "दोपहर 2 बजे के बाद कैफीन और भारी रात का खाना लेने से बचें"
                ],
                "timeline": "नींद अक्सर निरंतर सोने की दिनचर्या के 1-2 सप्ताह में सुधरती है। यदि इन परिवर्तनों के बाद भी अनिद्रा बनी रहती है, तो डॉक्टर से बात करें—नींद की विकार को व्यावसायिक देखभाल की आवश्यकता है।"
            }
        },
        # Anxiety
        "anxiety": {
            "en": {
                "interpretation": "Anxiety signals an overactive Vata. Grounding practices, warmth, and a predictable routine calm the nervous system.",
                "lifestyle": [
                    "Practice Nadi Shodhana for 5–10 minutes daily, especially in the morning",
                    "Meditate for 10 minutes in a quiet space daily",
                    "Apply warm sesame oil to your scalp, ears, and temples",
                    "Drink warm milk with ashwagandha or Brahmi in the evening (consult your doctor first)",
                    "Maintain regular meal and sleep times",
                    "Spend time in nature; avoid excessive news and social media"
                ],
                "timeline": "Most people notice calmer energy within 1–2 weeks. Anxiety that doesn't ease with lifestyle changes or feels intense warrants a conversation with a mental health professional."
            },
            "hi": {
                "interpretation": "चिंता एक सक्रिय वात का संकेत है। जमीन से जुड़ी प्रथाएं, गर्मी, और एक पूर्वानुमानित दिनचर्या तंत्रिका तंत्र को शांत करती है।",
                "lifestyle": [
                    "रोज सुबह नाड़ी शोधन 5-10 मिनट का अभ्यास करें",
                    "रोज एक शांत जगह में 10 मिनट ध्यान करें",
                    "अपने खोपड़ी, कानों और कनपटियों पर गर्म तिल का तेल लगाएं",
                    "शाम को अश्वगंधा या ब्राह्मी के साथ गुनगुना दूध पिएं (पहले अपने डॉक्टर से परामर्श लें)",
                    "नियमित भोजन और नींद का समय बनाए रखें",
                    "प्रकृति में समय बिताएं; अत्यधिक समाचार और सोशल मीडिया से बचें"
                ],
                "timeline": "अधिकांश लोग 1-2 सप्ताह में शांत ऊर्जा देखते हैं। चिंता जो जीवनशैली परिवर्तन के साथ कम न हो या तीव्र महसूस हो, तो मानसिक स्वास्थ्य पेशेवर से बात करें।"
            }
        },
        # Skin Issues
        "skin": {
            "en": {
                "interpretation": "Skin reflects your inner digestion and balance. Pitta excess (heat) often shows as rashes or acne. Cooling and nourishing from within helps.",
                "lifestyle": [
                    "Massage coconut or sesame oil on skin twice daily",
                    "Eat cooling foods: coconut, cucumber, leafy greens, sweet fruits",
                    "Drink turmeric milk (golden milk) every evening",
                    "Avoid spicy, oily, and fried foods",
                    "Sleep by 10 PM to support your body's natural renewal",
                    "Protect skin from harsh sun and extreme heat"
                ],
                "timeline": "Skin usually shows improvement within 2–4 weeks of consistent care. Persistent, spreading, or painful skin conditions need a dermatologist's evaluation."
            },
            "hi": {
                "interpretation": "त्वचा आपके आंतरिक पाचन और संतुलन को दर्शाती है। पित्त अधिकता (गर्मी) अक्सर रैशेज या मुंहासों के रूप में दिखाई देती है। अंदर से ठंडा और पोषण करना मदद करता है।",
                "lifestyle": [
                    "रोज दो बार त्वचा पर नारियल या तिल का तेल लगाएं",
                    "ठंडे खाद्य पदार्थ खाएं: नारियल, खीरा, पत्तेदार साग, मीठे फल",
                    "हर शाम हल्दी दूध (गोल्डन मिल्क) पिएं",
                    "मसालेदार, तैलीय और तली हुई चीजों से बचें",
                    "रात 10 बजे तक सोएं अपने शरीर के प्राकृतिक नवीकरण का समर्थन करने के लिए",
                    "कठोर धूप और चरम गर्मी से त्वचा की रक्षा करें"
                ],
                "timeline": "त्वचा आमतौर पर 2-4 सप्ताह के निरंतर देखभाल के साथ सुधार दिखाती है। लगातार, फैलने वाली, या दर्दनाक त्वचा की स्थिति को त्वचा विशेषज्ञ के मूल्यांकन की आवश्यकता है।"
            }
        },
        # Low Immunity
        "immunity": {
            "en": {
                "interpretation": "Weak immunity reflects poor digestion and Ojas (vital immunity). Building it requires nourishing foods, sleep, and gentle practices.",
                "lifestyle": [
                    "Eat warm, well-cooked, nourishing foods: soups, stews, ghee, nuts, seeds",
                    "Sleep 7–9 hours nightly; go to bed by 10 PM",
                    "Drink warm turmeric milk or herbal teas daily",
                    "Get gentle morning sunlight for 10–15 minutes",
                    "Manage stress with meditation or quiet time",
                    "Stay warm; avoid cold water and extreme temperature changes"
                ],
                "timeline": "Immunity builds slowly—most people notice improved resilience in 4–8 weeks. If you're frequently ill, see your doctor to rule out underlying issues."
            },
            "hi": {
                "interpretation": "कमजोर प्रतिरक्षा खराब पाचन और ओजस (जीवनीय प्रतिरक्षा) को दर्शाती है। इसे बनाने के लिए पोषक खाद्य पदार्थ, नींद, और कोमल प्रथाएं की आवश्यकता है।",
                "lifestyle": [
                    "गर्म, अच्छी तरह पकाया हुआ, पोषक भोजन खाएं: सूप, स्टू, घी, नट्स, बीज",
                    "रात 7-9 घंटे सोएं; रात 10 बजे तक बिस्तर पर जाएं",
                    "रोज गर्म हल्दी दूध या हर्बल चाय पिएं",
                    "सुबह 10-15 मिनट के लिए हल्की धूप लें",
                    "ध्यान या शांत समय के साथ तनाव का प्रबंधन करें",
                    "गर्म रहें; ठंडे पानी और चरम तापमान परिवर्तन से बचें"
                ],
                "timeline": "प्रतिरक्षा धीरे-धीरे बनती है—अधिकांश लोग 4-8 सप्ताह में बेहतर लचीलापन देखते हैं। यदि आप अक्सर बीमार हैं, तो अंतर्निहित समस्याओं को नियंत्रित करने के लिए अपने डॉक्टर को देखें।"
            }
        },
    }
    
    # Try to match the condition
    for key, data in wellness_db.items():
        if key in lower or lower in key:
            lang_key = "hi" if lang == "hi" else "en"
            return {
                "condition": condition,
                "found": True,
                "interpretation": data[lang_key]["interpretation"],
                "lifestyle": data[lang_key]["lifestyle"],
                "timeline": data[lang_key]["timeline"]
            }
    
    # Fallback if condition not found
    lang_key = "hi" if lang == "hi" else "en"
    if lang == "hi":
        return {
            "condition": condition,
            "found": False,
            "interpretation": "मैं इस विशेष स्थिति के लिए विस्तृत मार्गदर्शन नहीं देता। कृपया अपने डॉक्टर या आयुर्वेदिक चिकित्सक से सलाह लें।",
            "lifestyle": [
                "एक स्वास्थ्य पेशेवर से परामर्श लें",
                "आपकी स्थिति के बारे में अधिक जानकारी साझा करें"
            ],
            "timeline": "आपकी विशिष्ट स्थिति के लिए व्यक्तिगत मार्गदर्शन के लिए एक योग्य डॉक्टर से मिलें।"
        }
    else:
        return {
            "condition": condition,
            "found": False,
            "interpretation": "I don't have detailed guidance for this particular condition. Please consult your doctor or a registered Ayurvedic practitioner.",
            "lifestyle": [
                "Speak with a healthcare professional",
                "Share more details about your condition"
            ],
            "timeline": "For personalized guidance on your specific situation, consult a qualified doctor."
        }


@api_router.post("/wellness")
async def get_wellness(data: WellnessQueryIn, user=Depends(get_current_user)):
    """Get Ayurvedic wellness guidance for a condition."""
    guidance = get_wellness_guidance(data.condition, data.language)
    
    # Log the wellness query
    await db.wellness_queries.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "condition": data.condition,
        "language": data.language,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    
    return guidance


@api_router.get("/wellness/history")
async def get_wellness_history(user=Depends(get_current_user)):
    """Get user's wellness query history."""
    queries = await db.wellness_queries.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(10)
    return queries


# ------------------- Appointments -------------------
@api_router.post("/appointments")
async def create_appointment(data: AppointmentCreate, user=Depends(get_current_user)):
    if user["role"] != "patient":
        raise HTTPException(status_code=403, detail="Only patients can book")
    doctor = await db.users.find_one({"id": data.doctor_id, "role": "doctor"}, {"_id": 0, "password": 0})
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    appt = {
        "id": str(uuid.uuid4()),
        "patient_id": user["id"],
        "patient_name": user["name"],
        "doctor_id": data.doctor_id,
        "doctor_name": doctor["name"],
        "date": data.date,
        "time": data.time,
        "reason": data.reason,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.appointments.insert_one(appt)
    appt.pop("_id", None)
    return appt


@api_router.get("/appointments")
async def list_appointments(user=Depends(get_current_user)):
    if user["role"] == "doctor":
        q = {"doctor_id": user["id"]}
    else:
        q = {"patient_id": user["id"]}
    items = await db.appointments.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api_router.patch("/appointments/{appt_id}")
async def update_appointment(appt_id: str, data: AppointmentUpdate, user=Depends(require_doctor)):
    if data.status not in ("approved", "rejected", "pending"):
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.appointments.update_one(
        {"id": appt_id, "doctor_id": user["id"]},
        {"$set": {"status": data.status}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"status": "ok"}


# ------------------- Doctor: Patient Records Access -------------------
@api_router.get("/doctor/patients")
async def doctor_list_patients(user=Depends(require_doctor)):
    """Return unique patients who have at least one appointment with this doctor."""
    appts = await db.appointments.find(
        {"doctor_id": user["id"]}, {"_id": 0, "patient_id": 1, "patient_name": 1}
    ).to_list(500)
    seen = {}
    for a in appts:
        pid = a["patient_id"]
        if pid not in seen:
            seen[pid] = {"patient_id": pid, "patient_name": a["patient_name"]}
    return list(seen.values())


@api_router.get("/doctor/patients/{patient_id}/records")
async def doctor_view_patient_records(patient_id: str, user=Depends(require_doctor)):
    """Return a patient's health records — only if this doctor has an appointment with them."""
    has_appt = await db.appointments.find_one(
        {"doctor_id": user["id"], "patient_id": patient_id}
    )
    if not has_appt:
        raise HTTPException(
            status_code=403,
            detail="You do not have an appointment with this patient."
        )
    records = await db.records.find(
        {"user_id": patient_id}, {"_id": 0}
    ).sort("date", -1).to_list(500)
    return records


@api_router.post("/doctor/patients/{patient_id}/condition")
async def doctor_add_condition(patient_id: str, data: DoctorConditionCreate, user=Depends(require_doctor)):
    """Doctor writes a medical condition / diagnosis note into the patient's health records."""
    has_appt = await db.appointments.find_one(
        {"doctor_id": user["id"], "patient_id": patient_id}
    )
    if not has_appt:
        raise HTTPException(
            status_code=403,
            detail="You do not have an appointment with this patient."
        )
    severity_emoji = {"mild": "🟡", "moderate": "🟠", "severe": "🔴", "critical": "🚨"}.get(data.severity, "🟠")
    rec = {
        "id": str(uuid.uuid4()),
        "user_id": patient_id,
        "title": data.title,
        "record_type": "doctor_note",
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "notes": f"{severity_emoji} Severity: {data.severity.capitalize()}\n\nCondition: {data.condition}" + (f"\n\nDoctor Notes:\n{data.notes}" if data.notes else ""),
        "doctor_name": user["name"],
        "doctor_id": user["id"],
        "severity": data.severity,
        "is_serious": data.is_serious or data.severity in ("severe", "critical"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.records.insert_one(rec)
    rec.pop("_id", None)
    return rec


@api_router.patch("/records/{rec_id}/serious")
async def toggle_serious(rec_id: str, data: RecordSeriousToggle, user=Depends(get_current_user)):
    """Patient or doctor can mark/unmark a record as serious."""
    result = await db.records.update_one(
        {"id": rec_id},
        {"$set": {"is_serious": data.is_serious}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"status": "ok"}


# ------------------- Health Records -------------------
@api_router.post("/records")
async def create_record(data: HealthRecordCreate, user=Depends(get_current_user)):
    rec = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": data.title,
        "record_type": data.record_type,
        "date": data.date,
        "notes": data.notes,
        "doctor_name": data.doctor_name,
        "image_url": data.image_url,
        "is_serious": data.is_serious or False,
        "severity": "severe" if data.is_serious else "normal",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.records.insert_one(rec)
    rec.pop("_id", None)
    return rec


@api_router.get("/records")
async def list_records(user=Depends(get_current_user)):
    items = await db.records.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).to_list(500)
    return items


@api_router.delete("/records/{rec_id}")
async def delete_record(rec_id: str, user=Depends(get_current_user)):
    r = await db.records.delete_one({"id": rec_id, "user_id": user["id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "ok"}


# ------------------- Medicines -------------------
@api_router.post("/medicines")
async def create_medicine(data: MedicineCreate, user=Depends(get_current_user)):
    med = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": data.name,
        "dosage": data.dosage,
        "times": data.times,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "notes": data.notes,
        "taken_log": [],  # list of {date, time}
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.medicines.insert_one(med)
    med.pop("_id", None)
    return med


@api_router.get("/medicines")
async def list_medicines(user=Depends(get_current_user)):
    items = await db.medicines.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return items


@api_router.delete("/medicines/{med_id}")
async def delete_medicine(med_id: str, user=Depends(get_current_user)):
    r = await db.medicines.delete_one({"id": med_id, "user_id": user["id"]})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "ok"}


@api_router.post("/medicines/{med_id}/taken")
async def mark_taken(med_id: str, data: MarkTakenIn, user=Depends(get_current_user)):
    r = await db.medicines.update_one(
        {"id": med_id, "user_id": user["id"]},
        {"$addToSet": {"taken_log": {"date": data.date, "time": data.time}}},
    )
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"status": "ok"}


@api_router.post("/medicines/{med_id}/email-reminder")
async def email_reminder(med_id: str, user=Depends(get_current_user)):
    med = await db.medicines.find_one({"id": med_id, "user_id": user["id"]}, {"_id": 0})
    if not med:
        raise HTTPException(status_code=404, detail="Not found")
    subject = f"Vediccare reminder: time for your {med['name']}"
    times_str = ", ".join(med["times"])
    html = (
        f'<table role="presentation" width="100%" style="max-width:560px;margin:auto;'
        f'font-family:Arial,sans-serif;background:#FAF9F6;padding:32px;border-radius:12px">'
        f'<tr><td>'
        f'<h2 style="color:#C85A17;margin:0 0 12px 0;font-family:Georgia,serif">Vediccare Reminder</h2>'
        f'<p style="color:#2C2C2C;font-size:16px">Namaste {escape(user["name"])},</p>'
        f'<p style="color:#2C2C2C;font-size:16px">This is a gentle nudge to take your medicine:</p>'
        f'<div style="background:#FFFFFF;border:1px solid #E8E1D5;border-radius:10px;padding:20px;margin:16px 0">'
        f'<p style="margin:0;font-size:18px;color:#C85A17"><strong>{escape(med["name"])}</strong></p>'
        f'<p style="margin:6px 0 0 0;color:#5C5C5C">Dosage: {escape(med["dosage"])}</p>'
        f'<p style="margin:6px 0 0 0;color:#5C5C5C">Times: {escape(times_str)}</p>'
        f'</div>'
        f'<p style="color:#5C5C5C;font-size:13px">Stay well and balanced.</p>'
        f'<p style="font-size:12px;color:#888;margin-top:24px">Sent by {escape(EMAIL_FROM_NAME)}. '
        f'We never ask for your password or payment details by email.</p>'
        f'</td></tr></table>'
    )
    eid = await send_email(to=user["email"], subject=subject, html=html)
    return {"status": "sent" if eid else "failed", "email_id": eid}


# ------------------- Startup: seed demo data -------------------
@app.on_event("startup")
async def seed_demo():
    await db.users.update_many({"role": {"$in": ["patient", "doctor"]}, "$or": [{"is_verified": {"$exists": False}}, {"is_verified": {"$ne": True}}]}, {"$set": {"is_verified": True}})

    # Owner/admin patient account
    owner_email = OWNER_EMAIL.lower()
    if not await db.users.find_one({"email": owner_email}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Ayush Singh",
            "email": owner_email,
            "password": hash_password("Vediccare@2026"),
            "role": "patient",
            "specialization": None,
            "is_verified": True,
            "login_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    if not await db.users.find_one({"email": "admin@vediccare.app"}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "System Admin",
            "email": "admin@vediccare.app",
            "password": hash_password("admin1234"),
            "role": "admin",
            "specialization": None,
            "is_verified": True,
            "login_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Demo patient
    if not await db.users.find_one({"email": "demo@vediccare.app"}):
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "name": "Demo Patient",
            "email": "demo@vediccare.app",
            "password": hash_password("demo1234"),
            "role": "patient",
            "specialization": None,
            "is_verified": True,
            "login_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Seed doctors
    doctors = [
        {"name": "Dr. Aarav Sharma", "email": "aarav@vediccare.app", "specialization": "Ayurvedic Medicine (Panchakarma)"},
        {"name": "Dr. Meera Iyer", "email": "meera@vediccare.app", "specialization": "General Physician & Nutrition"},
        {"name": "Dr. Kavya Rao", "email": "kavya@vediccare.app", "specialization": "Pediatrics & Wellness"},
    ]
    for d in doctors:
        if not await db.users.find_one({"email": d["email"]}):
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "name": d["name"],
                "email": d["email"],
                "password": hash_password("doctor123"),
                "role": "doctor",
                "specialization": d["specialization"],
                "is_verified": True,
                "login_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })


@api_router.get("/")
async def root():
    return {"message": "Vediccare API is live"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
