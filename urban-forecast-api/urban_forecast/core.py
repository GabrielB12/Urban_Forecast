import pandas as pd


from datetime import timezone

def compute_taxa(df: pd.DataFrame) -> float:
    df = df.copy()
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)  # garante datetime
    df = df.sort_values("created_at")
    
    # Janela: apenas últimas 48h para evitar distorção com dados antigos
    cutoff = df["created_at"].max() - pd.Timedelta(hours=48)
    df = df[df["created_at"] >= cutoff]
    
    df["delta_pos"] = df["fill_percent"].diff()
    df["delta_horas"] = df["created_at"].diff().dt.total_seconds() / 3600
    valid = df[(df["delta_pos"] > 0) & (df["delta_horas"] > 0)]
    
    if valid.empty:
        return None
    return (valid["delta_pos"] / valid["delta_horas"]).mean()

def compute_previsao(df: pd.DataFrame, threshold: float = 90):
    if df.empty:
        return None
    df = df.copy()
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)
    df = df.sort_values("created_at")

    # DEBUG
    print("Total de linhas:", len(df))
    print("Primeiro:", df["created_at"].iloc[0])
    print("Último:", df["created_at"].iloc[-1])
    print(df[["created_at", "fill_percent"]].tail(5).to_string())

    taxa = compute_taxa(df)
    ultimo = df.iloc[-1]
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