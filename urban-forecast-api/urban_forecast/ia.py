from groq import Groq
import os
import pandas as pd
from datetime import timedelta

def generate_ai_summary(resultado: dict) -> str:
    try:
        data_utc = pd.to_datetime(resultado['predicted_date'], utc=True).to_pydatetime()
        data_sp = data_utc - timedelta(hours=3)
        data_formatada = data_sp.strftime("%d/%m/%Y às %Hh%M")

        client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

        prompt = f"""
            You are an urban waste monitoring assistant.
            Based on the data below, generate a short and direct summary (2–3 sentences) describing the current bin status and the estimated collection time.
            Current fill level: {result["current_level"]:.1f}%
            Fill rate: {result["rate"]:.3f}%/h
            Remaining hours: {result["hours_remaining"]:.1f}
            Predicted date: {result["predicted_date"]}
            Be concise and useful for waste collection operators.
            """

        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}]
        )

        return response.choices[0].message.content

    except Exception:
        return None
