import pandas as pd

def compute_baseline(df: pd.DataFrame, threshold: float = 90):
    if df.empty:
        return None

    df = df.copy()
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)
    df = df.sort_values("created_at")

    cutoff = df["created_at"].max() - pd.Timedelta(hours=48)
    df = df[df["created_at"] >= cutoff]

    df["delta_pos"] = df["fill_percent"].diff()
    df["delta_horas"] = df["created_at"].diff().dt.total_seconds() / 3600

    valid = df[(df["delta_pos"] > 0) & (df["delta_horas"] > 0)]

    if valid.empty:
        return None

    taxa = (valid["delta_pos"] / valid["delta_horas"]).median()

    ultimo = df.iloc[-1]
    nivel = ultimo["fill_percent"]

    if nivel >= threshold:
        return {
            "current_fill_level": float(nivel),
            "average_rate": float(taxa),
            "remaining_hours": 0.0,
            "predicted_date": ultimo["created_at"].isoformat()
        }

    horas = (threshold - nivel) / taxa

    return {
        "current_fill_level": float(nivel),
        "average_rate": float(taxa),
        "remaining_hours": float(horas),
        "predicted_date": (
            ultimo["created_at"] + pd.to_timedelta(horas, unit="h")
        ).isoformat()
    }
