from .core import compute_previsao


class ForecastModel:

    def __init__(self, threshold=90):
        self.threshold = threshold

    def predict(self, df):
        result = compute_previsao(df, self.threshold)
        if result is None:
            return {"error": "Dados insuficientes para previsão"}
        
        result["data_prevista"] = result["data_prevista"].isoformat()
        return result