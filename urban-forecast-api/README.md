# Urban Forecast

Sistema de previsão de enchimento de lixeiras inteligentes baseado em dados de sensores IoT.

## 📌 Descrição

Este projeto implementa um pipeline leve e interpretável para prever quando uma lixeira atingirá um nível crítico de preenchimento (threshold).

O sistema foi desenvolvido para cenários de cidades inteligentes (smart cities), permitindo otimizar rotas de coleta e reduzir custos operacionais.

---

## 🧠 Modelos Implementados

O sistema utiliza dois modelos de previsão:

### 🔵 Baseline (Taxa Média)

Calcula a taxa de enchimento com base na variação recente dos dados (últimas 48 horas).

* Simples e rápido
* Sensível a mudanças recentes

---

### 🟠 Regressão Linear

Aplica regressão linear sobre o tempo para estimar a tendência geral.

* Mais estável
* Captura comportamento global

---

## 🤖 Explicabilidade com IA

O sistema pode gerar resumos automáticos em linguagem natural utilizando LLM (Groq), facilitando a interpretação por operadores humanos.

---

## 🚀 Instalação

```bash
pip install -r requirements.txt
```

---

## 📊 Exemplo de Uso

```python
from urban_forecast.pipeline import run_pipeline
import pandas as pd

df = pd.DataFrame({
    "created_at": pd.date_range(start="2024-01-01", periods=10, freq="H"),
    "fill_percent": [10,15,20,25,30,35,40,45,50,55]
})

resultado = run_pipeline(df)

print(resultado)
```

---

## 📦 Saída Esperada

```json
{
  "baseline": {
    "nivel_atual": 55,
    "taxa_media": 5.0,
    "horas_restantes": 7.0,
    "data_prevista": "2024-01-01T17:00:00",
    "resumo_ia": "..."
  },
  "regressao": {
    "nivel_atual": 55,
    "taxa_media": 4.8,
    "horas_restantes": 7.3,
    "data_prevista": "2024-01-01T17:18:00",
    "resumo_ia": "..."
  }
}
```

---

## 📁 Estrutura do Projeto

```
urban_forecast/
  baseline.py
  regression.py
  pipeline.py
  ia.py
```

---

## 🎯 Aplicações

* Monitoramento de lixeiras inteligentes
* Otimização de coleta urbana
* Sistemas IoT
* Smart Cities

---

## 📄 Licença

MIT
