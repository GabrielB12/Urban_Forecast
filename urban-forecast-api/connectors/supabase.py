import requests
import pandas as pd


def fetch_data(url, key, sensor_id):
    endpoint = f"{url}/rest/v1/v_distancias_com_fill?select=*&sensor_id=eq.{sensor_id}&order=created_at.asc"
    res = requests.get(endpoint, headers={
        "apikey": key,
        "Authorization": f"Bearer {key}"
    })
    data = res.json()
    if not data:
        return pd.DataFrame()
    df = pd.DataFrame(data)
    df["created_at"] = pd.to_datetime(df["created_at"], utc=True)  # <-- utc=True
    return df