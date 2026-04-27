import pandas as pd
from datetime import datetime, timezone, timedelta
from groq import Groq
import os
from sklearn.linear_model import LinearRegression
import numpy as np

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

def compute_previsao_regressao(df, threshold=90):
    if df.empty:
        return None

    df = df.copy()
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)
    df = df.sort_values("created_at")

    # transforma tempo em número
    t0 = df["created_at"].min()
    df["t"] = (df["created_at"] - t0).dt.total_seconds() / 3600

    X = df[["t"]].values
    y = df["fill_percent"].values

    model = LinearRegression()
    model.fit(X, y)

    ultimo_t = df["t"].iloc[-1]
    nivel = df["fill_percent"].iloc[-1]

    coef = model.coef_[0]

    print("DEBUG REGRESSAO:")
    print("coef:", coef)
    print("nivel:", nivel)
    print("dados:", len(df))

    if coef <= 0:
        coef = 0.0001  # evita divisão por zero e mantém previsão

    horas = (threshold - nivel) / coef

    return {
        "nivel_atual": float(nivel),
        "taxa_media": float(coef),
        "horas_restantes": float(horas),
        "data_prevista": df["created_at"].iloc[-1] + pd.to_timedelta(horas, unit="h")
    }
    
def gerar_resumo_ia(resultado: dict) -> str:
    try:
        data_utc = datetime.fromisoformat(resultado['data_prevista'])
        data_sp = data_utc.astimezone(timezone(timedelta(hours=-3)))
        data_formatada = data_sp.strftime("%d/%m/%Y às %Hh%M")
        
        client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
        
        prompt = f"""Você é um assistente de monitoramento de lixeiras urbanas.
Com base nos dados abaixo, gere um resumo curto e direto (2-3 frases) em português sobre o estado da lixeira e quando deve ser coletada.

Nível atual: {resultado['nivel_atual']}%
Taxa de enchimento: {resultado['taxa_media']:.2f}% por hora
Horas restantes até atingir o limite: {resultado['horas_restantes']:.1f}h
Data estimada para coleta: {data_formatada} (horário de Brasília)

Seja objetivo e útil para o operador de coleta."""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200
        )
        return response.choices[0].message.content
    except Exception as e:
        print("ERRO gerar_resumo_ia:", type(e).__name__, str(e))
        return None
