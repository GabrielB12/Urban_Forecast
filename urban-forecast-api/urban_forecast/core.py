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

    # ✅ 1. garantir datetime correto
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)

    # ✅ 2. ordenar corretamente
    df = df.sort_values("created_at")

    # ✅ 3. pegar só dados recentes (ESSENCIAL)
    df = df.tail(30)

    # ✅ 4. calcular deltas
    df["delta_pos"] = df["fill_percent"].diff()
    df["delta_horas"] = df["created_at"].diff().dt.total_seconds() / 3600

    # ✅ 5. filtrar dados válidos (com proteção contra ruído)
    valid = df[
        (df["delta_pos"] > 0) &
        (df["delta_pos"] < 20) &   # evita saltos absurdos
        (df["delta_horas"] > 0)
    ]

    if valid.empty:
        return None

    taxa = (valid["delta_pos"] / valid["delta_horas"]).mean()

    # ✅ 6. último registro
    ultimo = df.iloc[-1]
    nivel = ultimo["fill_percent"]
    ultima_data = ultimo["created_at"]

    if taxa <= 0:
        return None

    horas = (threshold - nivel) / taxa

    print("📊 DF FINAL:")
    print(df.tail(5))

    print("📈 VALID:")
    print(valid.tail(5))

    print("📈 TAXA:", taxa)
    print("📍 ULTIMO:", ultimo)

    return {
        "nivel_atual": float(nivel),
        "taxa_media": float(taxa),
        "horas_restantes": float(horas),
        "data_prevista": (ultima_data + pd.to_timedelta(horas, unit="h")).isoformat()
    }