import pandas as pd
import matplotlib.pyplot as plt

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    mean_absolute_percentage_error
)

from urban_forecast.baseline import compute_baseline
from urban_forecast.regression import compute_regression


THRESHOLD = 70

df = pd.read_csv(
    "experiments/v_distancias_com_fill_rows.csv"
)

df["created_at"] = pd.to_datetime(
    df["created_at"],
    utc=True
)

# ordenação
df = df.sort_values(
    ["sensor_id", "created_at"]
)

# remove timestamps duplicados
df = df.drop_duplicates(
    subset=["sensor_id", "created_at"]
)

# remove leituras muito próximas (<5min)
df["time_diff"] = (
    df.groupby("sensor_id")["created_at"]
    .diff()
    .dt.total_seconds()
)

df = df[
    (df["time_diff"].isna()) |
    (df["time_diff"] > 200)
]

print("\nSensores encontrados:")
print(df["sensor_id"].unique())

print("\nQuantidade de registros por sensor:")
print(
    df.groupby("sensor_id").size()
)

results = []

for sensor_id in df["sensor_id"].unique():

    sensor_df = df[
        df["sensor_id"] == sensor_id
    ].copy()

    sensor_df = sensor_df.sort_values(
        "created_at"
    )

    # mínimo de dados
    if len(sensor_df) < 8:
        continue

    print(f"\nProcessando {sensor_id}")

    for i in range(5, len(sensor_df) - 1):

        train = sensor_df.iloc[:i]

        last_time = train[
            "created_at"
        ].iloc[-1]

        # procura o próximo threshold FUTURO
        future_rows = sensor_df[
            (
                sensor_df["created_at"] > last_time
            ) &
            (
                sensor_df["fill_percent"] >= THRESHOLD
            )
        ]

        if future_rows.empty:
            continue

        real_threshold_time = future_rows.iloc[0][
            "created_at"
        ]

        real_hours = (
            real_threshold_time - last_time
        ).total_seconds() / 3600

        # ignora valores inválidos
        if real_hours <= 0:
            continue

        # BASELINE
        baseline_result = compute_baseline(
            train,
            threshold=THRESHOLD
        )

        if baseline_result is not None:

            pred_hours = baseline_result[
                "horas_restantes"
            ]

            if pred_hours > 0:

                results.append({
                    "model": "Baseline",
                    "sensor_id": sensor_id,
                    "real_hours": real_hours,
                    "predicted_hours": pred_hours
                })

        # REGRESSION
        regression_result = compute_regression(
            train,
            threshold=THRESHOLD
        )

        if regression_result is not None:

            pred_hours = regression_result[
                "horas_restantes"
            ]

            if pred_hours > 0:

                results.append({
                    "model": "Regression",
                    "sensor_id": sensor_id,
                    "real_hours": real_hours,
                    "predicted_hours": pred_hours
                })

results_df = pd.DataFrame(results)

print("\nTotal de previsões:")
print(len(results_df))

# =========================
# MÉTRICAS GLOBAIS
# =========================

summary = []

for model in results_df["model"].unique():

    model_df = results_df[
        results_df["model"] == model
    ]

    mae = mean_absolute_error(
        model_df["real_hours"],
        model_df["predicted_hours"]
    )

    rmse = mean_squared_error(
        model_df["real_hours"],
        model_df["predicted_hours"]
    ) ** 0.5

    mape = mean_absolute_percentage_error(
        model_df["real_hours"],
        model_df["predicted_hours"]
    )

    summary.append({
        "Model": model,
        "MAE": mae,
        "RMSE": rmse,
        "MAPE": mape
    })

summary_df = pd.DataFrame(summary)

print("\nMétricas globais:")
print(summary_df)

summary_df.to_csv(
    "experiments/results.csv",
    index=False
)

# =========================
# MÉTRICAS POR SENSOR
# =========================

sensor_summary = []

for sensor_id in results_df["sensor_id"].unique():

    sensor_data = results_df[
        results_df["sensor_id"] == sensor_id
    ]

    for model in sensor_data["model"].unique():

        model_data = sensor_data[
            sensor_data["model"] == model
        ]

        mae = mean_absolute_error(
            model_data["real_hours"],
            model_data["predicted_hours"]
        )

        rmse = mean_squared_error(
            model_data["real_hours"],
            model_data["predicted_hours"]
        ) ** 0.5

        mape = mean_absolute_percentage_error(
            model_data["real_hours"],
            model_data["predicted_hours"]
        )

        sensor_summary.append({
            "sensor_id": sensor_id,
            "model": model,
            "MAE": mae,
            "RMSE": rmse,
            "MAPE": mape
        })

sensor_summary_df = pd.DataFrame(
    sensor_summary
)

print("\nMétricas por sensor:")
print(sensor_summary_df)

sensor_summary_df.to_csv(
    "experiments/sensor_results.csv",
    index=False
)

# =========================
# GRÁFICO
# =========================

plt.figure(figsize=(8, 5))

for model in results_df["model"].unique():

    model_df = results_df[
        results_df["model"] == model
    ]

    plt.scatter(
        model_df["real_hours"],
        model_df["predicted_hours"],
        label=model,
        s=40,
        alpha=0.7
    )

max_val = max(
    results_df["real_hours"].max(),
    results_df["predicted_hours"].max()
)

plt.plot(
    [0, max_val],
    [0, max_val],
    linestyle="--",
    label="Perfect Prediction"
)

plt.xlabel("Real Hours")
plt.ylabel("Predicted Hours")

plt.title(
    "Forecast Accuracy Comparison"
)

plt.grid(True, alpha=0.3)

plt.legend()

plt.tight_layout()

plt.savefig(
    "experiments/forecast_plot.png",
    dpi=200
)