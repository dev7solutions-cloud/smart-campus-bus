import os

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./smart_campus_bus.db")  # e.g. mysql+pymysql://user:pass@localhost/smart_campus_bus
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False)
Base = declarative_base()


class Student(Base):
    __tablename__ = "students"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    student_no = Column(String(20), unique=True, nullable=False)
    email = Column(String(160), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    stop_id = Column(Integer, nullable=False)


class Schedule(Base):
    __tablename__ = "schedules"
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_code = Column(String(20), nullable=False)
    course_title = Column(String(120), nullable=False)
    day = Column(Integer, nullable=False)
    start_time = Column(String(5), nullable=False)
    end_time = Column(String(5), nullable=False)
    building = Column(String(120))


class Attendance(Base):
    __tablename__ = "attendance"
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), primary_key=True)
    day = Column(Integer, primary_key=True)
    status = Column(String(10), default="absent")


class Bus(Base):
    __tablename__ = "buses"
    id = Column(Integer, primary_key=True)
    plate = Column(String(20), unique=True, nullable=False)
    capacity = Column(Integer, nullable=False)
    active = Column(Boolean, default=True)


class Driver(Base):
    __tablename__ = "drivers"
    id = Column(Integer, primary_key=True)
    name = Column(String(120), nullable=False)
    phone = Column(String(20))
    username = Column(String(60), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    bus_id = Column(Integer, ForeignKey("buses.id", ondelete="SET NULL"))
