# Vitalis

Vitalis is a premium AI health companion for personal health context, medical report analysis, medicine reminders, routine tracking, and plain-language guidance.

The app flow is:

- User login with Firebase email/password or Google sign-in.
- Health profile setup with age, sex, height, weight, conditions, medications, allergies, goals, sleep, exercise, eating habits, water intake, reminder preferences, and previous-report upload intent.
- Report and prescription upload.
- Backend parsing through FastAPI, Groq, PDF extraction, OCR helpers, and Supabase/Postgres storage.
- Reports dashboard and detail views.
- Vitalis AI chat that uses the saved health profile as context.

## Structure

```text
backend/
  app/
    api/          FastAPI routes for reports, prescriptions, and chat
    core/         config, logging, exceptions, validation
    database/     SQLAlchemy models and database setup
    schemas/      Pydantic response/request models
    services/     parser, report, prescription, OCR, and storage logic

frontend/
  app/            Next.js App Router pages
  components/     Vitalis UI components
  lib/            API adapter, Firebase auth, design tokens, types
```

## Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Firebase Auth
- Inter UI font
- IBM Plex Mono for numeric data
- lucide-react icons

Main routes:

```text
/login       Firebase email/password and Google sign-in
/profile     health profile onboarding
/upload      report or prescription upload
/reports     backend-backed document list
/reports/:id backend-backed document detail
/chat        Vitalis AI chat
/track       routine tracking
/reminders   medicine reminders
```

## Backend

- FastAPI
- Uvicorn
- Pydantic
- SQLAlchemy async
- asyncpg
- Groq chat completions
- pypdf
- pdf2image
- pytesseract
- Supabase/Postgres

Current API:

```text
GET    /health
POST   /api/v1/chat

POST   /api/v1/reports/upload
GET    /api/v1/reports
GET    /api/v1/reports/{report_id}
DELETE /api/v1/reports/{report_id}

POST   /api/v1/prescriptions/upload
GET    /api/v1/prescriptions
GET    /api/v1/prescriptions/{prescription_id}
DELETE /api/v1/prescriptions/{prescription_id}
```

## Environment

Create `.env` in the project root:

```env
GROQ_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=
SUPABASE_DATABASE_URI=
SUPABASE_STORAGE_BUCKET=
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
LOG_LEVEL=INFO
MAX_UPLOAD_SIZE_MB=25
REQUEST_TIMEOUT_SECONDS=120

NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Enable Email/Password and Google sign-in in Firebase Console.

## Run Locally

Backend:

```powershell
cd <project-root>
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

cd <project-root>\backend
<project-root>\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd <project-root>\frontend
npm install
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

- Frontend: http://127.0.0.1:3000
- Backend health: http://127.0.0.1:8000/health

## Current Progress

Completed:

- Vitalis branding applied across the frontend and AI chat.
- Firebase frontend auth added for email/password and Google sign-in.
- Full health-profile onboarding form added.
- Frontend upload flow sends PDFs to the backend.
- Reports and prescriptions are listed from backend APIs.
- Report detail fetches backend data by id.
- Vitalis chat endpoint uses Groq and the saved health profile context.
- Premium visual pass added: Inter font, darker side navigation, refined palette, and card shadows.
- Removed unused default Next.js public SVG assets and the default frontend README.
- `npx tsc --noEmit` and `npm run build` have passed after the integration work.

Known gaps:

- Google Fit is not connected yet; it needs separate Google OAuth scopes, Fitness API enablement, and consent handling.
- Health profile is stored in browser local storage for now; persistence should move to backend/Firebase Firestore.
- Routine, reminders, and weekly summary still use local/mock data until their backend models are added.
- OCR fallback requires local Tesseract and Poppler binaries in addition to Python packages.
