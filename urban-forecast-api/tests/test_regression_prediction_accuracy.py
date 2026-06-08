import pandas as pd
from pathlib import Path

from urban_forecast.regression import compute_regression

def test_regression_prediction_accuracy():
    csv_path = (
        Path(__file__).parent
        / "data"
        / "sample_regression_data.csv"
    )

    df = pd.read_csv(csv_path)

    df["created_at"] = pd.to_datetime(
        df["created_at"],
        utc=True
    )

    result = compute_regression(df)

    assert result is not None

    # expected fill rate: 10% per hour
    assert abs(result["average_rate"] - 10) < 0.01

    # remaining time expected: 5h until threshold=90%
    assert abs(result["remaining_hours"] - 5) < 0.01