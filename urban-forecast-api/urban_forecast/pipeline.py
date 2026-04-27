from .models import ForecastModel


def run_pipeline(df):
    base = compute_previsao(df)
    reg = compute_previsao_regressao(df)
    pro = compute_previsao_prophet(df)

    return {
        "baseline": base,
        "regressao": reg,
        "prophet": pro
    }
