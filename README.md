# CodeExam

An online programming examination platform for universities. Teachers create coding exams, students solve problems in-browser, code is auto-graded against hidden test cases, and results are published on demand.

Built as a final year CSE project.

## Features

- Student and teacher registration with profile management
- Teachers create exams, add questions with hidden test cases
- Students join with a 6-character exam code
- In-browser code editor (Monaco) with Run and Submit
- Sandboxed execution via Judge0 with automatic fallback to onlinecompiler.io
- Auto-grading against test cases, teacher override and feedback
- Anti-cheat event logging (tab switch, fullscreen exit, copy, paste)
- Plagiarism detection via token n-gram similarity
- Publish/unpublish results with letter grade and GPA calculation
- CSV export of results for teachers

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS + Monaco Editor |
| Backend | Django + Django REST Framework |
| Auth | JWT (SimpleJWT) |
| Database | PostgreSQL (Neon in production) |
| Code execution | Judge0 (primary), onlinecompiler.io (fallback) |
| Deployment | Render (backend), Vercel (frontend) |

## Architecture
React (Vercel)
│ HTTPS + JWT
▼
Django REST API (Render)
│
├── PostgreSQL (Neon)
│
└── Executor service
├── Judge0
└── onlinecompiler.io (fallback)


## Local development

### Backend

```bash
cd backend
python -m venv venv
source venv/Scripts/activate    # Windows Git Bash
pip install -r requirements.txt

# Create backend/.env with:
# SECRET_KEY=...
# DEBUG=True
# ALLOWED_HOSTS=localhost,127.0.0.1
# CORS_ALLOWED_ORIGINS=http://localhost:5173
# DB_NAME=codeexam
# DB_USER=postgres
# DB_PASSWORD=...
# DB_HOST=localhost
# DB_PORT=5432
# ONLINECOMPILER_API_KEY=...

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

cd frontend
npm install
npm run dev

###License
MIT

Save.

---

## Part 3: Create the GitHub repo

### 3.1 On GitHub

1. Go to `https://github.com/new`
2. **Repository name:** `codeexam`
3. **Description:** (optional) `Online programming examination platform built with React + Django`
4. **Visibility:** Public
5. **Do NOT check** any of the "Initialize this repository with..." boxes
6. Click **Create repository**

You'll land on a page that shows setup instructions. Keep that tab open.

### 3.2 On your terminal

```bash
cd /d/codeexam

# Initialize git (skip if already a repo)
git init

# Make sure git knows your name and email
git config user.name "Md. Arafat Khan"
git config user.email "your.email@example.com"

# Add everything
git add .

# CRITICAL: check what's about to be committed
git status

