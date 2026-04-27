import pandas as pd
from urban_forecast.pipeline import run_pipeline

def test_pipeline_basico():
    df = pd.DataFrame({
        "created_at": pd.date_range(start="2024-01-01", periods=10, freq="H"),
        "fill_percent": [10,15,20,25,30,35,40,45,50,55]
    })

    result = run_pipeline(df)

    assert "baseline" in result
    assert "regressao" in result

    assert result["baseline"] is not None
    assert result["regressao"] is not None
