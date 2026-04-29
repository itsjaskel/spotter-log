# SpotterLog

Full-stack web app that generates ELD (Electronic Logging Device) log sheets for truck drivers,
fully compliant with FMCSA Hours of Service (HOS) regulations.

Enter the current location, pickup, dropoff, and current cycle hours used → SpotterLog
calculates the route, enforces HOS limits, and generates the Daily Log Sheets for each day.

---

## Links

- GitHub:      https://github.com/itsjaskel/spotter-log
- Production:  https://spotter-log.vercel.app

---

## Prerequisites

- Python 3.12 or higher  →  https://www.python.org/downloads/
- Node.js 18 or higher   →  https://nodejs.org/
- Git                    →  https://git-scm.com/

---

## 1. Clone the repository

    git clone <repo-url>
    cd spotter-log

---

## 2. Backend (Django)

### 2a. Create and activate the virtual environment

Windows:
    cd backend
    python -m venv venv
    venv\Scripts\activate

Mac/Linux:
    cd backend
    python3 -m venv venv
    source venv/bin/activate

### 2b. Install dependencies

    pip install -r requirements.txt

### 2c. Create the environment variables file

Create a file at  backend/.env  with the following content:

    SECRET_KEY=any-long-random-secret-key
    DEBUG=True
    ALLOWED_HOSTS=localhost,127.0.0.1
    CORS_ALLOWED_ORIGINS=http://localhost:5173

(In production, Railway injects DATABASE_URL automatically. Locally, SQLite is used — no extra setup needed.)

### 2d. Run database migrations

    python manage.py migrate

### 2e. Start the development server

    python manage.py runserver

Backend is now running at:  http://localhost:8000

---

## 3. Frontend (React + Vite)

Open a second terminal (keep the backend running in the first one).

### 3a. Go to the frontend folder

    cd frontend

### 3b. Install dependencies

    npm install --legacy-peer-deps

> --legacy-peer-deps is required because react-leaflet@4 declares a peer dependency
> on React 18, while this project uses React 19. It works correctly in practice.

### 3c. Create the environment variables file

Create a file at  frontend/.env  with the following content:

    VITE_API_URL=http://localhost:8000/api

### 3d. Start the development server

    npm run dev

The app is now available at:  http://localhost:5173

---

## 4. Postman collection

A ready-to-use Postman collection is included at:

    docs/SpotterLog.postman_collection.json

Import it into Postman to test the API directly against the production backend
(https://spotter-log-production.up.railway.app/api) or your local server.

---

## 5. Using the app

1. Open http://localhost:5173 in your browser
2. Fill in the form:
   - Current Location       →  where the driver is now        (e.g. Chicago, IL)
   - Pickup Location        →  where the cargo is picked up   (e.g. Dallas, TX)
   - Dropoff Location       →  where the cargo is delivered   (e.g. Miami, FL)
   - Current Cycle Used (hrs) →  hours already used in the current 70-hr cycle (e.g. 20)
3. Click "Generate Trip Log"
4. You will see:
   - A map with the full route and 3 labeled markers
   - ELD Daily Log Sheets for each day of the trip

---

## 6. Tech stack

Backend
  - Django 6 + Django REST Framework
  - SQLite (local) / PostgreSQL (production on Railway)
  - Nominatim for geocoding (no API key required)
  - OSRM for routing (no API key required)

Frontend
  - React 19 + Vite
  - Material UI (MUI) v7
  - Redux Toolkit
  - Leaflet + react-leaflet (map)
  - Axios (HTTP client)

Deployment
  - Backend  →  Railway  (auto-detects backend/ folder)
  - Frontend →  Vercel   (auto-detects frontend/ folder)

---

## 7. Project structure

    spotter-log/
    ├── backend/
    │   ├── spotter_log/       # Django project settings
    │   ├── trips/             # models, views, HOS calculator, routing service
    │   ├── requirements.txt
    │   ├── .env               # not committed to git
    │   └── Procfile           # for Railway deployment
    ├── frontend/
    │   ├── src/
    │   │   ├── components/    # TripForm, RouteMap, LogSheet
    │   │   ├── store/         # Redux slice
    │   │   └── api/           # Axios client
    │   ├── package.json
    │   └── .env               # not committed to git
    ├── docs/
    │   └── SpotterLog.postman_collection.json
    └── README.txt
