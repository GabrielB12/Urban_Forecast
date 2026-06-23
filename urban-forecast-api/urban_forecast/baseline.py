import pandas as pd

def compute_baseline(df: pd.DataFrame, threshold: float = 90):
    if df.empty:
        return None

    df = df.copy()
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)
    df = df.sort_values("created_at")

    cutoff = df["created_at"].max() - pd.Timedelta(hours=96)
    df = df[df["created_at"] >= cutoff]

    df["delta_pos"] = df["fill_percent"].diff()
    df["delta_horas"] = df["created_at"].diff().dt.total_seconds() / 3600

    valid = df[(df["delta_pos"] > 0) & (df["delta_horas"] > 0)]

    if valid.empty:
        return None

    median = (valid["delta_pos"] / valid["delta_horas"]).median()

    last = df.iloc[-1]
    fill_level = last["fill_percent"]

    if fill_level >= threshold:
        return {
            "current_fill_level": float(fill_level),
            "average_rate": float(median),
            "remaining_hours": 0.0,
            "predicted_date": last["created_at"].isoformat()
        }

    hours = (threshold - fill_level) / median

    return {
        "current_fill_level": float(fill_level),
        "average_rate": float(median),
        "remaining_hours": float(hours),
        "predicted_date": (
            last["created_at"] + pd.to_timedelta(hours, unit="h")
        ).isoformat()
    }
