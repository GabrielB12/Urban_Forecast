from .core import (
    compute_previsao,
    compute_previsao_regressao,
    gerar_resumo_ia
)

def run_pipeline(df):
    base = compute_previsao(df)
    reg = compute_previsao_regressao(df)

    if base:
        base["data_prevista"] = base["data_prevista"].isoformat()
        base["resumo_ia"] = gerar_resumo_ia(base)

    if reg:
        reg["resumo_ia"] = gerar_resumo_ia(reg)

    return {
        "baseline": base,
        "regressao": reg
    }
