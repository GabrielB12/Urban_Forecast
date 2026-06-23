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
    "experiments/v_distancias_com_fill_rows_100.csv"
)

df["created_at"] = pd.to_datetime(
    df["created_at"],
    utc=True
)

# sorting
df = df.sort_values(
    ["sensor_id", "created_at"]
)

# remove duplicated timestamps
df = df.drop_duplicates(
    subset=["sensor_id", "created_at"]
)

# remove readings that are too close
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

    # minimum data
    if len(sensor_df) < 8:
        continue

    print(f"\nProcessando {sensor_id}")

    discarded_short = 0
    discarded_no_future = 0
    discarded_invalid_hours = 0
    discarded_too_long = 0

    for i in range(5, len(sensor_df) - 1):

        threshold = sensor_df["threshold_percent"].iloc[0]

        train = sensor_df.iloc[:i]

        last_time = train[
            "created_at"
        ].iloc[-1]

        # looks for the next future threshold
        future_rows = sensor_df[
            (
                sensor_df["created_at"] > last_time
            ) &
            (
                sensor_df["fill_percent"] >= threshold
            )
        ]

        if future_rows.empty:
            discarded_no_future += 1
            continue

        real_threshold_time = future_rows.iloc[0][
            "created_at"
        ]

        real_hours = (
            real_threshold_time - last_time
        ).total_seconds() / 3600

        # invalid values
        if real_hours <= 0:
            discarded_invalid_hours += 1
            continue

        if real_hours > 72:
            discarded_too_long += 1
            continue

        # BASELINE
        baseline_result = compute_baseline(
            train,
            threshold=threshold
        )

        if baseline_result is not None:

            pred_hours = baseline_result[
                "remaining_hours"
            ]

            if pred_hours > 0:

                results.append({
                    "model": "Baseline",
                    "sensor_id": sensor_id,
                    "train_size": i,
                    "real_hours": real_hours,
                    "predicted_hours": pred_hours
                })

        # REGRESSION
        regression_result = compute_regression(
            train,
            threshold=threshold
        )

        if regression_result is not None:

            pred_hours = regression_result[
                "remaining_hours"
            ]

            if pred_hours > 0:

                results.append({
                    "model": "Regression",
                    "sensor_id": sensor_id,
                    "train_size": i,
                    "real_hours": real_hours,
                    "predicted_hours": pred_hours
                })

    print(
        f"  Descartados -> curto: {discarded_short}, "
        f"sem futuro: {discarded_no_future}, "
        f"horas inválidas: {discarded_invalid_hours}, "
        f"> 72h: {discarded_too_long}"
    )

results_df = pd.DataFrame(results)

print("\nTotal de previsões:")
print(len(results_df))

# =========================
# GLOBAL METRICS
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
        "N": len(model_df),
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
# METRICS PER SENSOR
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
            "N": len(model_data),
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
# GRAPH: CALCULATED vs REAL
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

# =========================
# ERROR vs TRAIN SIZE
# =========================

results_df["abs_error"] = (
    results_df["real_hours"] - results_df["predicted_hours"]
).abs()

error_by_size = (
    results_df
    .groupby(["model", "train_size"])["abs_error"]
    .mean()
    .reset_index()
)

plt.figure(figsize=(8, 5))

for model in error_by_size["model"].unique():
    model_df = error_by_size[error_by_size["model"] == model]
    plt.plot(
        model_df["train_size"],
        model_df["abs_error"],
        marker="o",
        label=model
    )

plt.xlabel("Training window size (n. of points)")
plt.ylabel("Mean Absolute Error (hours)")
plt.title("Forecast error vs. training window size")
plt.grid(True, alpha=0.3)
plt.legend()
plt.tight_layout()
plt.savefig("experiments/error_vs_window.png", dpi=200)