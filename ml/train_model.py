"""Train the Random Forest demand model and export it for the web app and API."""
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

ROOT = Path(__file__).resolve().parent
FEATURES = ["day", "hour", "stop", "scheduled", "absent", "exam_week"]
TARGET = "riders"


def export_forest(model: RandomForestRegressor) -> list[dict]:
    trees = []
    for est in model.estimators_:
        t = est.tree_
        trees.append({
            "f": t.feature.tolist(),
            "t": [round(float(x), 4) for x in t.threshold],
            "l": t.children_left.tolist(),
            "r": t.children_right.tolist(),
            "v": [round(float(x[0][0]), 3) for x in t.value],
        })
    return trees


def main() -> None:
    df = pd.read_csv(ROOT / "data" / "ridership_history.csv")
    X, y = df[FEATURES], df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=7)

    model = RandomForestRegressor(n_estimators=25, max_depth=8, min_samples_leaf=10, random_state=7, n_jobs=-1)
    model.fit(X_train, y_train)
    pred = model.predict(X_test)

    metrics = {
        "algorithm": "RandomForestRegressor",
        "n_estimators": model.n_estimators,
        "max_depth": model.max_depth,
        "train_rows": int(len(X_train)),
        "test_rows": int(len(X_test)),
        "mae": round(float(mean_absolute_error(y_test, pred)), 3),
        "r2": round(float(r2_score(y_test, pred)), 4),
        "feature_importance": {f: round(float(i), 4) for f, i in zip(FEATURES, model.feature_importances_)},
    }

    (ROOT / "models").mkdir(exist_ok=True)
    joblib.dump(model, ROOT / "models" / "rf_demand_model.joblib")
    (ROOT / "models" / "metrics.json").write_text(json.dumps(metrics, indent=2))

    web_model = {"features": FEATURES, "metrics": metrics, "trees": export_forest(model)}
    web_out = ROOT.parent / "frontend" / "src" / "data" / "rf_model.json"
    web_out.parent.mkdir(parents=True, exist_ok=True)
    web_out.write_text(json.dumps(web_model, separators=(",", ":")))
    print(json.dumps(metrics, indent=2))
    print(f"exported web model -> {web_out} ({web_out.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
