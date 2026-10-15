"""Generate a synthetic historical ridership dataset for the campus bus system.

Each row is one (day, departure time, stop) observation with the number of
students who had a class requiring that trip, the number who reported absence,
and the number of students who actually boarded the bus (target).
"""
import numpy as np
import pandas as pd
from pathlib import Path

RNG = np.random.default_rng(42)
DAYS = 5  # Sunday..Thursday
STOPS = 6
STOP_POPULARITY = np.array([1.35, 1.25, 0.9, 0.8, 1.0, 0.7])
HOURS = np.arange(7.0, 17.01, 0.25)


def peak_curve(hour: np.ndarray) -> np.ndarray:
    morning = np.exp(-((hour - 7.6) ** 2) / 0.35) * 1.0
    midday = np.exp(-((hour - 11.8) ** 2) / 0.6) * 0.55
    afternoon = np.exp(-((hour - 14.5) ** 2) / 0.8) * 0.45
    return morning + midday + afternoon + 0.05


def generate(weeks: int = 16) -> pd.DataFrame:
    rows = []
    for week in range(weeks):
        exam_week = week in (7, 15)
        for day in range(DAYS):
            day_factor = [1.1, 1.0, 1.05, 0.95, 0.75][day]
            for hour in HOURS:
                curve = peak_curve(np.array([hour]))[0]
                for stop in range(STOPS):
                    lam = 32 * curve * day_factor * STOP_POPULARITY[stop]
                    scheduled = RNG.poisson(lam)
                    absent_rate = RNG.beta(2, 18) + (0.08 if day == 4 else 0) + (-0.03 if exam_week else 0)
                    absent = RNG.binomial(scheduled, float(np.clip(absent_rate, 0, 0.9)))
                    expected = scheduled - absent
                    no_show = RNG.binomial(expected, 0.04 + 0.04 * (hour > 13))
                    walk_ins = RNG.poisson(3.5 * curve * STOP_POPULARITY[stop] * (1.4 if exam_week else 1.0))
                    riders = max(0, expected - no_show + walk_ins)
                    rows.append((day, round(float(hour), 2), stop, scheduled, absent, int(exam_week), riders))
    return pd.DataFrame(rows, columns=["day", "hour", "stop", "scheduled", "absent", "exam_week", "riders"])


if __name__ == "__main__":
    out = Path(__file__).parent / "data" / "ridership_history.csv"
    df = generate()
    df.to_csv(out, index=False)
    print(f"wrote {len(df)} rows to {out}")
