from connectors.supabase import fetch_data
from urban_forecast.pipeline import run_pipeline

SUPABASE_URL = "https://zitresvvjiondhgiuqal.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppdHJlc3Z2amlvbmRoZ2l1cWFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNTI2MjksImV4cCI6MjA3NzcyODYyOX0.Z_cBFBjyLF77pkVAnd5xMaNM7YX3bdZmqjMUOMZHI9k"

df = fetch_data(SUPABASE_URL, SUPABASE_KEY, sensor_id="Lixeira-A1")

result = run_pipeline(df)

print(result)