from .models import ForecastModel


def run_pipeline(df, threshold=90):
    model = ForecastModel(threshold)
    return model.predict(df)