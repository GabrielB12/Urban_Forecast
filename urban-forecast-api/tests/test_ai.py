from urban_forecast.ia import generate_ai_summary


def test_ai_summary_generation():
    data = {
        "average_rate": 5,
        "remaining_hours": 10
    }

    result = generate_ai_summary(data)

    assert result is None or isinstance(result, str)
