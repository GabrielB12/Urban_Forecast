from connectors.supabase import fetch_data
from urban_forecast.pipeline import run_pipeline

import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

df = fetch_data(SUPABASE_URL, SUPABASE_KEY, sensor_id="Lixeira-A1")

result = run_pipeline(df)

print(result)