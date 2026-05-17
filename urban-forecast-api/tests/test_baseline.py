import pandas as pd
from urban_forecast.baseline import compute_baseline


def test_baseline_average_rate():
    df = pd.DataFrame({
        "created_at": pd.date_range(start="2024-01-01", periods=5, freq="h"),
        "fill_percent": [10, 20, 30, 40, 50]
    })

    result = compute_baseline(df)

    assert result is not None
    assert "taxa_media" in result
    assert result["taxa_media"] > 0


def test_baseline_remaining_time():
    df = pd.DataFrame({
        "created_at": pd.date_range(start="2024-01-01", periods=5, freq="h"),
        "fill_percent": [10, 20, 30, 40, 50]
    })

    result = compute_baseline(df)

    assert result is not None
    assert "horas_restantes" in result
    assert result["horas_restantes"] >= 0