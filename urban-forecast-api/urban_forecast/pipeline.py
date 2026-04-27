from .baseline import compute_baseline
from .regression import compute_regression
from .ia import gerar_resumo_ia

def run_pipeline(df):

    baseline = compute_baseline(df)
    regression = compute_regression(df)

    if baseline:
        baseline["resumo_ia"] = gerar_resumo_ia(baseline)

    if regression:
        regression["resumo_ia"] = gerar_resumo_ia(regression)

    return {
        "baseline": baseline,
        "regressao": regression
    }
