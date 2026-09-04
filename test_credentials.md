# Vediccare Test Credentials

## Owner (real user)
- Email: `ayushsingh12rock@gmail.com`
- Password: `Vediccare@2026`
- Role: patient

## Demo patient (one-click login)
- Email: `demo@vediccare.app`
- Password: `demo1234`
- Role: patient
- Endpoint: `POST /api/auth/demo` returns a token instantly

## Seeded doctors
| Name | Email | Password | Specialization |
|------|-------|----------|----------------|
| Dr. Aarav Sharma | aarav@vediccare.app | doctor123 | Ayurvedic Medicine (Panchakarma) |
| Dr. npm install
npm run devMeera Iyer | meera@vediccare.app | doctor123 | General Physician & Nutrition |
| Dr. Kavya Rao | kavya@vediccare.app | doctor123 | Pediatrics & Wellness |

All accounts are seeded on backend startup via `seed_demo()` in `/app/backend/server.py`.
