from groq import Groq
import os
import pandas as pd
from datetime import timedelta

def gerar_resumo_ia(resultado: dict) -> str:
    try:
        data_utc = pd.to_datetime(resultado['predicted_date'], utc=True).to_pydatetime()
        data_sp = data_utc - timedelta(hours=3)
        data_formatada = data_sp.strftime("%d/%m/%Y às %Hh%M")

        client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

        prompt = f"""Você é um assistente de monitoramento de lixeiras urbanas.
Com base nos dados abaixo, gere um resumo curto e direto (2-3 frases) em português sobre o estado da lixeira e quando deve ser coletada.
Nível atual: {resultado['current_fill_level']}%
Taxa: {resultado['average_rate']:.2f}%/h
Horas restantes: {resultado['remaining_hours']:.1f}
Data: {data_formatada}

Seja objetivo e útil para o operador de coleta.
"""

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content

    except Exception:
        return None
