from urban_forecast.ia import gerar_resumo_ia


def test_ai_summary_generation():
    data = {
        "average_rate": 5,
        "remaining_hours": 10
    }

    result = gerar_resumo_ia(data)

    assert result is None or isinstance(result, str)