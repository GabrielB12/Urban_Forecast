from urban_forecast.pipeline import run_pipeline
import pandas as pd

df = pd.DataFrame({
    "created_at": pd.date_range(start="2024-01-01", periods=10, freq="H"),
    "fill_percent": [10,15,20,25,30,35,40,45,50,55]
})

print(run_pipeline(df))
