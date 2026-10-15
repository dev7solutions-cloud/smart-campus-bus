"""Populate the API database with demo data (same seed as the web app)."""
import json
import random

from app.db import Base, Bus, Driver, Schedule, SessionLocal, Student, engine
from app.main import hash_pw

random.seed(2026)
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
db = SessionLocal()
buses = [Bus(plate=f"NJR 102{i}", capacity=c) for i, c in enumerate([45, 45, 45, 30, 30, 50], start=1)]
db.add_all(buses)
db.commit()
for i, b in enumerate(buses, start=1):
    db.add(Driver(name=f"Driver {i}", username=f"driver{i}", password_hash=hash_pw("driver123"), bus_id=b.id))
starts = ["08:00", "08:00", "09:00", "10:00", "11:00", "13:00"]
for i in range(1, 121):
    st = Student(name=f"Student {i}", student_no=str(442000000 + i), email=f"s{i}@nu.edu.sa", password_hash=hash_pw("student123"), stop_id=random.randint(0, 5))
    db.add(st)
    db.flush()
    for day in range(5):
        if random.random() < 0.7:
            s = random.choice(starts)
            h = int(s[:2]) + random.choice([1, 2, 3])
            db.add(Schedule(student_id=st.id, course_code="IS 211", course_title="Database Systems", day=day, start_time=s, end_time=f"{h:02d}:15"))
db.commit()
print(json.dumps({"students": db.query(Student).count(), "schedules": db.query(Schedule).count()}))
