import pandas as pd
import matplotlib.pyplot as plt

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    mean_absolute_percentage_error
)

from urban_forecast.baseline import compute_baseline
from urban_forecast.regression import compute_regression


df = pd.read_csv(
    "experiments/v_distancias_com_fill_rows.csv"
)

df["created_at"] = pd.to_datetime(df["created_at"])

df = df.sort_values("created_at")

results = []

THRESHOLD = 70

for sensor_id in df["sensor_id"].unique():

    sensor_df = df[
        df["sensor_id"] == sensor_id
    ].copy()

    sensor_df = sensor_df.sort_values(
        "created_at"
    )

    if len(sensor_df) < 8:
        continue

    threshold_rows = sensor_df[
        sensor_df["fill_percent"] >= THRESHOLD
    ]

    if threshold_rows.empty:
        continue

    real_threshold_time = threshold_rows.iloc[0]["created_at"]

    for i in range(5, len(sensor_df) - 1):

        train = sensor_df.iloc[:i]

        last_time = train["created_at"].iloc[-1]

        real_hours = (
            real_threshold_time - last_time
        ).total_seconds() / 3600

        if real_hours <= 0:
            continue

        # BASELINE
        baseline_result = compute_baseline(
            train,
            threshold=THRESHOLD
        )

        if baseline_result is not None:

            pred_hours = baseline_result[
                "remaining_hours"
            ]

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
                "remaining_hours"
            ]

            results.append({
                "model": "Regression",
                "sensor_id": sensor_id,
                "real_hours": real_hours,
                "predicted_hours": pred_hours
            })


results_df = pd.DataFrame(results)

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

print(summary_df)

summary_df.to_csv(
    "experiments/results.csv",
    index=False
)

# graph
plt.figure(figsize=(8,5))

for model in results_df["model"].unique():

    model_df = results_df[
        results_df["model"] == model
    ]

    plt.scatter(
        model_df["real_hours"],
        model_df["predicted_hours"],
        label=model
    )

max_val = max(
    results_df["real_hours"].max(),
    results_df["predicted_hours"].max()
)

plt.plot(
    [0, max_val],
    [0, max_val],
    linestyle="--"
)

plt.xlabel("Real Hours")
plt.ylabel("Predicted Hours")

plt.legend()

plt.tight_layout()

plt.savefig(
    "experiments/forecast_plot.png"
)