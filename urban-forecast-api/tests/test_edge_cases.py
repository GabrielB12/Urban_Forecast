import pandas as pd
from urban_forecast.pipeline import run_pipeline


def test_unsorted_timestamps():
    df = pd.DataFrame({
        "created_at": [
            "2024-01-01 03:00",
            "2024-01-01 01:00",
            "2024-01-01 02:00"
        ],
        "fill_percent": [40, 10, 20]
    })

    df["created_at"] = pd.to_datetime(df["created_at"])

    result = run_pipeline(df)

    assert result is not None
    assert "baseline" in result
    assert "regression" in result


def test_single_point():
    df = pd.DataFrame({
        "created_at": pd.date_range(start="2024-01-01", periods=1, freq="h"),
        "fill_percent": [25]
    })

    result = run_pipeline(df)

    assert result is not None
    assert "baseline" in result
    assert "regression" in result


def test_negative_values():
    df = pd.DataFrame({
        "created_at": pd.date_range(start="2024-01-01", periods=5, freq="h"),
        "fill_percent": [10, -5, 20, -1, 30]
    })

    result = run_pipeline(df)

    assert result is not None
    assert "baseline" in result
    assert "regression" in result