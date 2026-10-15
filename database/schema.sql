-- AI-Based Smart Campus Bus Scheduling System - MySQL schema (based on the ER diagram)
CREATE DATABASE IF NOT EXISTS smart_campus_bus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smart_campus_bus;

CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stops (
  id INT PRIMARY KEY,
  name_en VARCHAR(120) NOT NULL,
  name_ar VARCHAR(120) NOT NULL
);

CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  student_no VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  stop_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stop_id) REFERENCES stops(id)
);

CREATE TABLE buses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plate VARCHAR(20) NOT NULL UNIQUE,
  capacity INT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(20),
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  bus_id INT NULL UNIQUE,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL
);

-- Class schedule entries (Schedule entity)
CREATE TABLE schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_code VARCHAR(20) NOT NULL,
  course_title VARCHAR(120) NOT NULL,
  day TINYINT NOT NULL COMMENT '0=Sunday .. 4=Thursday',
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  building VARCHAR(120),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  INDEX idx_sched_day (day, start_time)
);

CREATE TABLE attendance (
  student_id INT NOT NULL,
  day TINYINT NOT NULL,
  status ENUM('present','absent') NOT NULL DEFAULT 'present',
  PRIMARY KEY (student_id, day),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Generated bus trips (links schedules demand to buses and drivers)
CREATE TABLE trips (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day TINYINT NOT NULL,
  type ENUM('arrival','return') NOT NULL,
  depart_time TIME NOT NULL,
  arrive_time TIME NOT NULL,
  bus_id INT NOT NULL,
  driver_id INT NULL,
  priority BOOLEAN NOT NULL DEFAULT FALSE,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE TABLE trip_stops (
  trip_id INT NOT NULL,
  stop_id INT NOT NULL,
  predicted_riders INT NOT NULL,
  PRIMARY KEY (trip_id, stop_id),
  FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
  FOREIGN KEY (stop_id) REFERENCES stops(id)
);

-- AI predictions (Prediction entity)
CREATE TABLE predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day TINYINT NOT NULL,
  depart_time TIME NOT NULL,
  stop_id INT NOT NULL,
  bus_id INT NULL,
  scheduled_students INT NOT NULL,
  absent_students INT NOT NULL,
  predicted_riders DECIMAL(6,2) NOT NULL,
  model_version VARCHAR(40) NOT NULL DEFAULT 'rf-v1',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stop_id) REFERENCES stops(id),
  FOREIGN KEY (bus_id) REFERENCES buses(id)
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target VARCHAR(40) NOT NULL COMMENT 'all | students | drivers | student:<id> | driver:<id>',
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO stops (id, name_en, name_ar) VALUES
 (0,'Student Housing A','السكن الطلابي أ'),(1,'Student Housing B','السكن الطلابي ب'),
 (2,'Al-Faisaliyah District','حي الفيصلية'),(3,'King Fahd District','حي الملك فهد'),
 (4,'Downtown Najran','وسط نجران'),(5,'Al-Khalidiyah District','حي الخالدية');

INSERT INTO buses (plate, capacity) VALUES ('NJR 1021',45),('NJR 1022',45),('NJR 1023',45),('NJR 1024',30),('NJR 1025',30),('NJR 1026',50);
