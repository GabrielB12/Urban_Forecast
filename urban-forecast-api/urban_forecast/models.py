from .core import compute_previsao


class ForecastModel:

    def __init__(self, threshold=90):
        self.threshold = threshold

    def predict(self, df):
        return compute_previsao(df, self.threshold)