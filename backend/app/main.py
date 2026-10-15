"""SmartBus AI REST API.

Run:  uvicorn app.main:app --reload   (from the backend/ folder)
Docs: http://localhost:8000/docs
"""
import hashlib

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .db import Attendance, Base, Bus, Driver, Schedule, SessionLocal, Student, engine
from .scheduler import generate_plan, predict

Base.metadata.create_all(engine)
app = FastAPI(title="SmartBus AI - Smart Campus Bus Scheduling API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()


class StudentIn(BaseModel):
    name: str
    student_no: str
    email: str
    password: str = Field(min_length=6)
    stop_id: int = Field(ge=0, le=5)


class ScheduleIn(BaseModel):
    student_id: int
    course_code: str
    course_title: str
    day: int = Field(ge=0, le=4)
    start_time: str
    end_time: str
    building: str | None = None


class BusIn(BaseModel):
    plate: str
    capacity: int = Field(ge=10, le=80)
    active: bool = True


class DriverIn(BaseModel):
    name: str
    phone: str | None = None
    username: str
    password: str = "driver123"
    bus_id: int | None = None


class PredictIn(BaseModel):
    day: int = Field(ge=0, le=4)
    hour: float = Field(ge=6, le=20)
    stop: int = Field(ge=0, le=5)
    scheduled: int = Field(ge=0)
    absent: int = Field(ge=0, default=0)
    exam_week: bool = False


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/students", status_code=201)
def create_student(body: StudentIn, db: Session = Depends(get_db)):
    if db.query(Student).filter((Student.email == body.email) | (Student.student_no == body.student_no)).first():
        raise HTTPException(409, "Student already exists")
    st = Student(name=body.name, student_no=body.student_no, email=body.email, password_hash=hash_pw(body.password), stop_id=body.stop_id)
    db.add(st)
    db.commit()
    return {"id": st.id}


@app.get("/api/students")
def list_students(db: Session = Depends(get_db)):
    return [{"id": s.id, "name": s.name, "student_no": s.student_no, "email": s.email, "stop_id": s.stop_id} for s in db.query(Student)]


@app.delete("/api/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    db.query(Student).filter_by(id=student_id).delete()
    db.commit()
    return {"deleted": student_id}


@app.post("/api/login")
def login(role: str, identifier: str, password: str, db: Session = Depends(get_db)):
    if role == "student":
        user = db.query(Student).filter((Student.email == identifier) | (Student.student_no == identifier)).first()
    elif role == "driver":
        user = db.query(Driver).filter_by(username=identifier).first()
    else:
        raise HTTPException(400, "Unknown role")
    if not user or user.password_hash != hash_pw(password):
        raise HTTPException(401, "Invalid credentials")
    return {"id": user.id, "name": user.name, "role": role}


@app.post("/api/schedules", status_code=201)
def add_schedule(body: ScheduleIn, db: Session = Depends(get_db)):
    row = Schedule(**body.model_dump())
    db.add(row)
    db.commit()
    return {"id": row.id}


@app.get("/api/schedules")
def list_schedules(student_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Schedule)
    if student_id:
        q = q.filter_by(student_id=student_id)
    return [{c.name: getattr(r, c.name) for c in Schedule.__table__.columns} for r in q]


@app.put("/api/attendance/{student_id}/{day}")
def set_attendance(student_id: int, day: int, absent: bool, db: Session = Depends(get_db)):
    db.query(Attendance).filter_by(student_id=student_id, day=day).delete()
    if absent:
        db.add(Attendance(student_id=student_id, day=day, status="absent"))
    db.commit()
    return {"student_id": student_id, "day": day, "absent": absent}


@app.post("/api/buses", status_code=201)
def add_bus(body: BusIn, db: Session = Depends(get_db)):
    bus = Bus(**body.model_dump())
    db.add(bus)
    db.commit()
    return {"id": bus.id}


@app.get("/api/buses")
def list_buses(db: Session = Depends(get_db)):
    return [{"id": b.id, "plate": b.plate, "capacity": b.capacity, "active": b.active} for b in db.query(Bus)]


@app.post("/api/drivers", status_code=201)
def add_driver(body: DriverIn, db: Session = Depends(get_db)):
    d = Driver(name=body.name, phone=body.phone, username=body.username, password_hash=hash_pw(body.password), bus_id=body.bus_id)
    db.add(d)
    db.commit()
    return {"id": d.id}


@app.get("/api/drivers")
def list_drivers(db: Session = Depends(get_db)):
    return [{"id": d.id, "name": d.name, "phone": d.phone, "username": d.username, "bus_id": d.bus_id} for d in db.query(Driver)]


@app.post("/api/predict")
def predict_demand(body: PredictIn):
    """Random Forest prediction of riders for one stop and departure time."""
    return {"predicted_riders": round(predict(body.day, body.hour, body.stop, body.scheduled, body.absent, body.exam_week), 2)}


@app.post("/api/plans/{day}")
def generate(day: int, exam_week: bool = False, db: Session = Depends(get_db)):
    """Generate the AI-optimized bus plan for a day (0=Sunday .. 4=Thursday)."""
    if not 0 <= day <= 4:
        raise HTTPException(400, "day must be 0..4")
    students = [{"id": s.id, "stop_id": s.stop_id} for s in db.query(Student)]
    courses = [{"student_id": c.student_id, "day": c.day, "start": c.start_time, "end": c.end_time} for c in db.query(Schedule)]
    absences = [{"student_id": a.student_id, "day": a.day} for a in db.query(Attendance)]
    buses = [{"id": b.id, "capacity": b.capacity, "active": b.active} for b in db.query(Bus)]
    drivers = [{"id": d.id, "bus_id": d.bus_id} for d in db.query(Driver)]
    return generate_plan(students, courses, absences, buses, drivers, day, exam_week)
