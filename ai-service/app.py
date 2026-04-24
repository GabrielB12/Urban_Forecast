from flask import Flask, request, jsonify
import pandas as pd
from prophet import Prophet
import psycopg2
import os

app = Flask(__name__)

@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.json
        sensor = data.get("sensor_id")

        if not sensor:
            return jsonify({"erro": "sensor_id é obrigatório"}), 400

        # conexão via variável de ambiente
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))

        # query segura (evita SQL injection)
        df = pd.read_sql("""
            SELECT created_at as ds, fill_percent as y
            FROM v_distancias_com_fill
            WHERE sensor_id = %s
            ORDER BY created_at
        """, conn, params=[sensor])

        conn.close()

        if df.empty:
            return jsonify({"data_prevista": None})

        # modelo Prophet
        model = Prophet()
        model.fit(df)

        # previsão próximas 12 horas
        future = model.make_future_dataframe(periods=12, freq='H')
        forecast = model.predict(future)

        # encontrar quando chega a 90%
        for _, row in forecast.iterrows():
            if row['yhat'] >= 90:
                return jsonify({"data_prevista": str(row['ds'])})

        return jsonify({"data_prevista": None})

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# IMPORTANTE: não usar app.run() em produção
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=10000)
