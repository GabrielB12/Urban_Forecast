from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

from urban_forecast.pipeline import run_pipeline
from connectors.supabase import fetch_data

app = Flask(__name__)

CORS(app)

SUPABASE_URL = "https://zitresvvjiondhgiuqal.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdHJlc3Z2amlvbmRoZ2l1cWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTI2MjksImV4cCI6MjA3NzcyODYyOX0.Z_cBFBjyLF77pkVAnd5xMaNM7YX3bdZmqjMUOMZHI9k"


@app.route("/")
def home():
    return {"status": "API rodando 🚀"}


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