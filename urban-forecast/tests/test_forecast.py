import pandas as pd
from urban_forecast.pipeline import run_pipeline


def test_prediction():
    data = pd.DataFrame({
        "fill_percent": [10, 20, 30, 40],
        "created_at": pd.date_range("2024-01-01", periods=4, freq="H")
    })

    result = run_pipeline(data)

    assert result is not None
    assert result["horas_restantes"] > 0