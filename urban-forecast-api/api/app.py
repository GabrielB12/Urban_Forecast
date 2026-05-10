from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

from urban_forecast.pipeline import run_pipeline
from connectors.supabase import fetch_data

app = Flask(__name__)

CORS(app)

import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

@app.route("/")
def home():
    return {"status": "API rodando 🚀"}


@app.route("/debug/<sensor_id>")
def debug(sensor_id):
    df = fetch_data(SUPABASE_URL, SUPABASE_KEY, sensor_id)
    return jsonify({
        "total_linhas": len(df),
        "primeiro": str(df["created_at"].iloc[0]) if not df.empty else None,
        "ultimo": str(df["created_at"].iloc[-1]) if not df.empty else None,
        "ultimas_5": df[["created_at", "fill_percent"]].tail(5).to_dict(orient="records") if not df.empty else []
    })

@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return '', 200  # responde preflight

    try:
        body = request.json

        if "data" in body:
            df = pd.DataFrame(body["data"])
            df["created_at"] = pd.to_datetime(df["created_at"])

        elif "sensor_id" in body:
            df = fetch_data(SUPABASE_URL, SUPABASE_KEY, body["sensor_id"])

        else:
            return jsonify({"error": "Envie 'data' ou 'sensor_id'"}), 400

        result = run_pipeline(df)

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500