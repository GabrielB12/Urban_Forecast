import pandas as pd
import numpy as np
from sklearn.linear_model import HuberRegressor


def compute_regression(df: pd.DataFrame, threshold: float = 90):
    if df.empty:
        return None

    df = df.copy()
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)
    df = df.sort_values("created_at")

    cutoff = df["created_at"].max() - pd.Timedelta(hours=96)
    df = df[df["created_at"] >= cutoff]

    if len(df) < 2:
        return None

    t0 = df["created_at"].min()
    df["t"] = (df["created_at"] - t0).dt.total_seconds() / 3600

    X = df[["t"]].values
    y = df["fill_percent"].values

    model = HuberRegressor()
    model.fit(X, y)

    coef = model.coef_[0]
    fill_percent = df["fill_percent"].iloc[-1]

    if coef <= 0 or np.isnan(coef):
        return None
    
    if fill_percent >= threshold:
        return {
            "current_fill_level": float(fill_percent),
            "average_rate": float(coef),
            "remaining_hours": 0.0,
            "predicted_date": df["created_at"].iloc[-1].isoformat()
        }

    hours = (threshold - fill_percent) / coef

    return {
        "current_fill_level": float(fill_percent),
        "average_rate": float(coef),
        "remaining_hours": float(hours),
        "predicted_date": (
            df["created_at"].iloc[-1] + pd.to_timedelta(hours, unit="h")
        ).isoformat()
    }
