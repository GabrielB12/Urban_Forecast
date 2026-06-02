import pandas as pd
import matplotlib.pyplot as plt

from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    mean_absolute_percentage_error
)

from urban_forecast.baseline import compute_baseline
from urban_forecast.regression import compute_regression


df = pd.read_csv("experiments/dataset.csv")

df["created_at"] = pd.to_datetime(df["created_at"])

# treino
train = df.iloc[:-3]

# valor real
last_train_time = train["created_at"].iloc[-1]

threshold_row = df[df["fill_percent"] >= 90].iloc[0]

real_hours = (
    threshold_row["created_at"] - last_train_time
).total_seconds() / 3600

# baseline
baseline_result = compute_baseline(train)

baseline_hours = baseline_result["horas_restantes"]

# regression
regression_result = compute_regression(train)

regression_hours = regression_result["horas_restantes"]

# métricas
models = ["Baseline", "Regression"]

predictions = [
    baseline_hours,
    regression_hours
]

y_true = [real_hours, real_hours]

mae = [
    abs(real_hours - baseline_hours),
    abs(real_hours - regression_hours)
]

rmse = [
    mean_squared_error(
        [real_hours],
        [baseline_hours]
    ) ** 0.5,

    mean_squared_error(
        [real_hours],
        [regression_hours]
    ) ** 0.5
]

mape = [
    mean_absolute_percentage_error(
        [real_hours],
        [baseline_hours]
    ),
    mean_absolute_percentage_error(
        [real_hours],
        [regression_hours]
    )
]

results = pd.DataFrame({
    "Model": models,
    "Predicted Hours": predictions,
    "Real Hours": y_true,
    "MAE": mae,
    "RMSE": rmse,
    "MAPE": mape
})

print(results)

results.to_csv(
    "experiments/results.csv",
    index=False
)

# gráfico
plt.figure(figsize=(6,4))

plt.bar(
    models,
    predictions
)

plt.axhline(
    real_hours,
    linestyle="--",
    label="Real"
)

plt.ylabel("Hours Until 90% Fill")

plt.legend()

plt.tight_layout()

plt.savefig(
    "experiments/forecast_plot.png"
)