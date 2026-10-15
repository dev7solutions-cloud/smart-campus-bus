"""AI scheduling engine (Python port of frontend/src/lib/scheduler.js)."""
from __future__ import annotations

import math
from collections import defaultdict
from pathlib import Path

import joblib
import numpy as np

MODEL_PATH = Path(__file__).resolve().parents[2] / "ml" / "models" / "rf_demand_model.joblib"
_model = None


def model():
    global _model
    if _model is None:
        _model = joblib.load(MODEL_PATH)
    return _model


def predict(day: int, hour: float, stop: int, scheduled: int, absent: int = 0, exam_week: bool = False) -> float:
    x = np.array([[day, hour, stop, scheduled, absent, int(exam_week)]])
    return max(0.0, float(model().predict(x)[0]))


def to_min(hhmm: str) -> int:
    h, m = map(int, hhmm[:5].split(":"))
    return h * 60 + m


def to_hhmm(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def generate_plan(students, courses, absences, buses, drivers, day: int, exam_week=False,
                  travel_min=20, buffer_min=10, turnaround_min=40) -> dict:
    absent_ids = {a["student_id"] for a in absences if a["day"] == day}
    spans: dict[int, list[int]] = {}
    for c in courses:
        if c["day"] != day:
            continue
        s, e = to_min(c["start"]), to_min(c["end"])
        cur = spans.setdefault(c["student_id"], [s, e])
        cur[0], cur[1] = min(cur[0], s), max(cur[1], e)

    groups: dict[tuple, dict] = {}
    for st in students:
        if st["id"] not in spans:
            continue
        first, last = spans[st["id"]]
        for typ, depart in (("arrival", (first - travel_min - buffer_min) // 15 * 15), ("return", math.ceil((last + 5) / 30) * 30)):
            g = groups.setdefault((typ, depart, st["stop_id"]), {"type": typ, "depart": depart, "stop_id": st["stop_id"], "scheduled": 0, "absent": 0})
            g["scheduled"] += 1
            g["absent"] += st["id"] in absent_ids

    slots = defaultdict(list)
    for g in groups.values():
        if g["scheduled"] - g["absent"] <= 0:
            continue
        g["predicted"] = round(predict(day, g["depart"] / 60, g["stop_id"], g["scheduled"], g["absent"], exam_week))
        if g["predicted"] > 0:
            slots[(g["depart"], g["type"] != "arrival", g["type"])].append(g)

    fleet = sorted([b for b in buses if b["active"]], key=lambda b: -b["capacity"])
    free = {b["id"]: 0 for b in fleet}
    trips_by = {b["id"]: 0 for b in fleet}
    trips, warnings = [], []
    for (depart, _, typ) in sorted(slots):
        priority = typ == "arrival" and depart + travel_min <= 9 * 60
        left = sorted(({**g, "need": math.ceil(g["predicted"] * (1.1 if priority else 1))} for g in slots[(depart, typ != "arrival", typ)]), key=lambda g: -g["need"])
        while left:
            avail = [b for b in fleet if free[b["id"]] <= depart]
            total = sum(g["need"] for g in left)
            fits = [b for b in avail if b["capacity"] >= total]
            bus = min(fits, key=lambda b: (trips_by[b["id"]], b["capacity"])) if fits else (avail[0] if avail else None)
            if bus is None:
                warnings.append({"depart": to_hhmm(depart), "type": typ, "unserved": sum(g["need"] for g in left)})
                break
            load, stops = 0, []
            while left and load < bus["capacity"]:
                g = left[0]
                take = min(bus["capacity"] - load, g["need"])
                stops.append({"stop_id": g["stop_id"], "predicted": take})
                load += take
                g["need"] -= take
                if g["need"] == 0:
                    left.pop(0)
            free[bus["id"]] = depart + turnaround_min
            trips_by[bus["id"]] += 1
            driver = next((d for d in drivers if d.get("bus_id") == bus["id"]), None)
            trips.append({"type": typ, "depart": to_hhmm(depart), "arrive": to_hhmm(depart + travel_min), "bus_id": bus["id"],
                          "driver_id": driver["id"] if driver else None, "capacity": bus["capacity"], "priority": priority,
                          "predicted": load, "stops": stops})
    return {"day": day, "trips": trips, "warnings": warnings}
