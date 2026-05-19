# Urban Forecast

![Tests](https://github.com/GabrielB12/Site_Lixeira/actions/workflows/tests.yml/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.10+-blue)

Smart bin fill-level prediction system based on IoT sensor data.

## 📌 Description

This project implements a lightweight and interpretable pipeline to predict when a smart bin will reach a critical fill level (threshold).

The system was developed for smart city scenarios, enabling the optimization of collection routes and reduction of operational costs.

---

## 🧠 Implemented Models

The system uses two forecasting models:

### 🔵 Baseline (Average Rate)

Calculates the fill rate based on recent data variation (last 48 hours).

* Simple and fast
* Sensitive to recent changes

---

### 🟠 Linear Regression

Applies linear regression over time to estimate the overall trend.

* More stable
* Captures global behavior

---

## 🤖 AI Explainability

The system can generate automatic natural language summaries using LLM (Groq), making interpretation easier for human operators.

---

## 🚀 Installation

```bash
pip install -r requirements.txt
```

---

## 📊 Usage Example

```python
from urban_forecast.pipeline import run_pipeline
import pandas as pd

df = pd.DataFrame({
    "created_at": pd.date_range(start="2024-01-01", periods=10, freq="H"),
    "fill_percent": [10,15,20,25,30,35,40,45,50,55]
})

result = run_pipeline(df)

print(result)
```

---

## 📦 Expected Output

```json
{
  "baseline": {
    "current_level": 55,
    "average_rate": 5.0,
    "remaining_hours": 7.0,
    "predicted_date": "2024-01-01T17:00:00",
    "ai_summary": "..."
  },
  "regression": {
    "current_level": 55,
    "average_rate": 4.8,
    "remaining_hours": 7.3,
    "predicted_date": "2024-01-01T17:18:00",
    "ai_summary": "..."
  }
}
```

---

## 📁 Project Structure

```
urban_forecast/
  baseline.py
  regression.py
  pipeline.py
  ia.py
```

---

## 🎯 Applications

* Smart bin monitoring
* Urban collection optimization
* IoT systems
* Smart Cities

---

## 📄 License

MIT
