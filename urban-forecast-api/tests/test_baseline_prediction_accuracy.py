import pandas as pd
from pathlib import Path

from urban_forecast.baseline import compute_baseline


def test_baseline_prediction_accuracy():
    csv_path = (
        Path(__file__).parent
        / "data"
        / "sample_baseline_data.csv"
    )

    df = pd.read_csv(csv_path)

    df["created_at"] = pd.to_datetime(
        df["created_at"],
        utc=True
    )

    result = compute_baseline(df)

    assert result is not None

    # expected average fill rate: 10% per hour
    assert abs(result["taxa_media"] - 10) < 0.01

    # current level should be 40%
    assert abs(result["nivel_atual"] - 40) < 0.01

    # remaining time expected: 5h until threshold=90%
    assert abs(result["horas_restantes"] - 5) < 0.01