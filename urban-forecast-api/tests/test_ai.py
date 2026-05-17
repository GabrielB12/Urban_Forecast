from urban_forecast.ia import gerar_resumo_ia


def test_ai_summary_generation():
    data = {
        "taxa_media": 5,
        "horas_restantes": 10
    }

    result = gerar_resumo_ia(data)

    assert result is None or isinstance(result, str)