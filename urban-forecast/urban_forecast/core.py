import pandas as pd


def compute_taxa(df: pd.DataFrame) -> float:
    df = df.sort_values("created_at")

    df["delta_pos"] = df["fill_percent"].diff()
    df["delta_horas"] = df["created_at"].diff().dt.total_seconds() / 3600

    valid = df[
        (df["delta_pos"] > 0) &
        (df["delta_horas"] > 0)
    ]

    if valid.empty:
        return None

    taxa = (valid["delta_pos"] / valid["delta_horas"]).mean()
    return taxa


def compute_previsao(df: pd.DataFrame, threshold: float = 90):
    if df.empty:
        return None

    taxa = compute_taxa(df)

    ultimo = df.sort_values("created_at").iloc[-1]
    nivel = ultimo["fill_percent"]
    ultima_data = ultimo["created_at"]

    if taxa is None or nivel is None:
        return None

    horas = (threshold - nivel) / taxa

    return {
        "nivel_atual": float(nivel),
        "taxa_media": float(taxa),
        "horas_restantes": float(horas),
        "data_prevista": ultima_data + pd.to_timedelta(horas, unit="h")
    }