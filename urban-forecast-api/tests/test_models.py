import pandas as pd
from urban_forecast.pipeline import run_pipeline

def test_base_pipeline():
    df = pd.DataFrame({
        "created_at": pd.date_range(start="2024-01-01", periods=10, freq="h"),
        "fill_percent": [10,15,20,25,30,35,40,45,50,55]
    })

    result = run_pipeline(df)

    assert "baseline" in result
    assert "regression" in result

    assert result["baseline"] is not None
    assert result["regression"] is not None


def test_pipeline_empty_dataframe():
    df = pd.DataFrame(columns=["created_at", "fill_percent"])

    result = run_pipeline(df)

    assert result["baseline"] is None
    assert result["regression"] is None