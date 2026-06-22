from .baseline import compute_baseline
from .regression import compute_regression
from .ia import generate_ai_summary

def run_pipeline(df):

    baseline = compute_baseline(df)
    regression = compute_regression(df)

    if baseline:
        baseline["resumo_ia"] = generate_ai_summary(baseline)

    if regression:
        regression["resumo_ia"] = generate_ai_summary(regression)

    return {
        "baseline": baseline,
        "regressao": regression
    }
