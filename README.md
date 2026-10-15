# SmartBus AI — AI-Based Smart Campus Bus Scheduling System

Graduation project (Najran University · Department of Information Systems · 2026).
A web system that analyses student class timetables and attendance, predicts transportation demand with a **Random Forest** model and generates **dynamic, optimized bus schedules** instead of fixed timetables — reducing waiting time and overcrowding.

**Team:** Atyaf Salem Al-Ansari · Afrah Jaber Al-Mutlaq · Saadih Hassan Asiri · Amjad Jaber Al-Shahrani — **Supervisor:** Dr. Muhammad Al-Jubairi

## Features
| Role | What they can do |
|---|---|
| Student | Register / sign in, enter class schedule (manual or CSV upload), report absence, see personalised optimized bus timings, receive notifications |
| Administrator | Dashboard & KPIs, run the AI scheduler (per day / whole week), exam-week mode, manage students, buses & drivers, reports (CSV export / print), inspect the AI model and test predictions, broadcast notifications |
| Driver | Assigned bus, daily trips, route with expected passengers per stop, demand predictions, notifications |

Scheduling rules from the report: early lectures get priority, absent students are excluded from demand, passengers are distributed by bus capacity, students are notified when their bus time changes. Fully bilingual (English / العربية with RTL).

## Project structure
```
frontend/   React 19 + Vite + Tailwind web app (runs the trained Random Forest in the browser)
backend/    FastAPI REST API (SQLAlchemy, SQLite by default or MySQL) + Python scheduling engine
database/   MySQL schema (schema.sql) based on the ER diagram
ml/         Synthetic data generation + Random Forest training (scikit-learn)
```

## Run locally
### 1. Web app
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in frontend/dist
```
Demo accounts: student `student@nu.edu.sa / student123`, admin `admin / admin123`, driver `driver1 / driver123`.
The live demo stores data in the browser (localStorage); use *Reset demo data* in the admin panel to restore it.

### 2. AI model
```bash
cd ml
pip install -r requirements.txt
python generate_data.py   # -> ml/data/ridership_history.csv
python train_model.py     # -> ml/models/rf_demand_model.joblib + frontend/src/data/rf_model.json
```
Inputs: day, hour, stop, scheduled students, absent students, exam week → output: expected riders.
Current metrics: MAE 0.909 riders, R² 0.976 (25 trees, max depth 8).

### 3. Backend API (optional)
```bash
cd backend
pip install -r requirements.txt
python seed_demo.py                         # demo data
uvicorn app.main:app --reload               # http://localhost:8000/docs
# MySQL: mysql < ../database/schema.sql
#        export DATABASE_URL=mysql+pymysql://user:pass@localhost/smart_campus_bus
```
Main endpoints: `POST /api/students`, `POST /api/login`, `POST /api/schedules`, `PUT /api/attendance/{student_id}/{day}`, `POST /api/buses`, `POST /api/drivers`, `POST /api/predict`, `POST /api/plans/{day}`.
