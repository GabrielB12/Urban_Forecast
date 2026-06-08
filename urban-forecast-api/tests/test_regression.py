import pandas as pd
from urban_forecast.regression import compute_regression


def test_regression_linear_growth():
    df = pd.DataFrame({
        "created_at": pd.date_range(start="2024-01-01", periods=6, freq="h"),
        "fill_percent": [10,20,30,40,50,60]
    })

    result = compute_regression(df)

    assert result is not None
    assert result["average_rate"] > 0


def test_regression_constant_values():
    df = pd.DataFrame({
        "created_at": pd.date_range(start="2024-01-01", periods=5, freq="h"),
        "fill_percent": [50,50,50,50,50]
    })

    result = compute_regression(df)

    assert result is None


def test_threshold_prediction():
    df = pd.DataFrame({
        "created_at": pd.date_range(start="2024-01-01", periods=10, freq="h"),
        "fill_percent": [10,20,30,40,50,60,70,80,85,90]
    })

    result = compute_regression(df)

    assert result is not None
    assert result["predicted_date"] is not None