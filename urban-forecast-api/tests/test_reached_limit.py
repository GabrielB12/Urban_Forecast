import pandas as pd

from urban_forecast.baseline import compute_baseline
from urban_forecast.regression import compute_regression

def test_baseline_threshold_already_reached():
    df = pd.DataFrame({
        "created_at": pd.date_range(
            start="2024-01-01",
            periods=5,
            freq="h"
        ),
        "fill_percent": [50, 60, 70, 80, 95]
    })

    result = compute_baseline(df)

    assert result is not None
    assert result["current_fill_level"] == 95
    assert result["remaining_hours"] == 0

def test_regression_threshold_already_reached():
    df = pd.DataFrame({
        "created_at": pd.date_range(
            start="2024-01-01",
            periods=5,
            freq="h"
        ),
        "fill_percent": [50, 60, 70, 80, 95]
    })

    result = compute_regression(df)

    assert result is not None
    assert result["current_fill_level"] == 95
    assert result["remaining_hours"] == 0