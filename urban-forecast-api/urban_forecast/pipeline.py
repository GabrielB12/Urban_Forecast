from .core import compute_previsao, compute_previsao_regressao


def run_pipeline(df):
    base = compute_previsao(df)
    reg = compute_previsao_regressao(df)

    return {
        "baseline": base,
        "regressao": reg
    }
