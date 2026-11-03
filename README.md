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

## Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer with npm
- Tesseract OCR and Poppler (`pdftoppm`) for scanned PDFs and the OCR test
  - Debian/Ubuntu: `sudo apt-get install tesseract-ocr poppler-utils`
  - macOS: `brew install tesseract poppler`
  - Windows: install both and add their install directories to `PATH`
- A Supabase project and a Groq API key (see Environment)

Digital PDFs are parsed without OCR. Tesseract and Poppler are only needed when a
page has no usable text layer.

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

### Backend

macOS/Linux:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Windows PowerShell:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local` if it does not exist:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Then start the dev server:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Open:

- Frontend: http://127.0.0.1:3000
- Backend health: http://127.0.0.1:8000/health

## Testing

The backend test suite uses Python's standard-library `unittest`; no extra test
dependency is required. Tests run offline and inject a fake LLM, so they do not
need `GROQ_API_KEY`, Supabase credentials, or network access.

Run all tests from `backend/` after activating the virtual environment:

```bash
# macOS/Linux
.venv/bin/python -m unittest discover -s tests -v

# Windows PowerShell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

A healthy run ends with `Ran 51 tests ... OK`.

Run a single module, class, or test case:

```bash
.venv/bin/python -m unittest tests.test_pipeline -v
.venv/bin/python -m unittest tests.test_pipeline.PipelineTests -v
.venv/bin/python -m unittest tests.test_pipeline.PipelineTests.test_pneumonia_regression -v
```

Coverage includes:

- Patient demographics extraction, including missing and malformed values.
- Compound blood pressure values and reference-range evaluation.
- Numeric parsing, unit normalization, Fahrenheit conversion, and deduplication.
- Gender- and age-aware reference ranges.
- OCR versus native PDF text, multi-page assembly, and OCR confidence.
- Separate OCR, extraction, and completeness confidence metrics.
- End-to-end parsing regressions for the pneumonia and diabetes fixtures.

Fixtures live in `backend/tests/fixtures/`. `pneumonia_report.pdf` is a scanned
document that exercises OCR; `diabetes_report.pdf` has a native text layer.

Frontend checks:

```bash
cd frontend
npx tsc --noEmit
npm run build
```

## Contributing

1. Create a branch with a descriptive name, such as `feat/ocr-confidence` or
   `fix/blood-pressure-parsing`.
2. Follow the setup steps above, then run the backend tests and frontend checks
   before opening a pull request.
3. Add or update tests for changes to extraction, normalization, reference
   ranges, confidence, or the parsing pipeline. Reuse the helpers in
   `backend/tests/support.py` (`make_metric`, `fake_llm`) and keep new fixtures
   small and de-identified.
4. Keep tests deterministic and offline. Do not call real Groq or Supabase
   services from tests.
5. Match the existing Python and TypeScript style. Avoid adding dependencies
   unless they are necessary and discussed in the pull request.
6. Never commit `.env`, `frontend/.env.local`, API keys, or generated uploads.
   These paths are already ignored by `.gitignore`.
7. In the pull request description, summarize the change and list the commands
   you ran to verify it.

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
- Deterministic patient demographics extraction added; missing values stay `null`.
- Config-driven reference ranges added with compound blood pressure and age/gender handling.
- Scanned PDF OCR now reports page-level confidence and falls back per page.
- Separate OCR, extraction, and completeness confidence metrics exposed to the UI.
- Offline `unittest` regression suite added for parsing, units, ranges, confidence, and OCR.
- `npx tsc --noEmit` and `npm run build` have passed after the integration work.

Known gaps:

- Google Fit is not connected yet; it needs separate Google OAuth scopes, Fitness API enablement, and consent handling.
- Health profile is stored in browser local storage for now; persistence should move to backend/Firebase Firestore.
- Routine, reminders, and weekly summary still use local/mock data until their backend models are added.
- OCR fallback requires local Tesseract and Poppler binaries in addition to Python packages.
