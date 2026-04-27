# Urban Forecast API

Sistema de previsão de enchimento de lixeiras inteligentes baseado em dados IoT.

## 📌 Descrição

Este projeto implementa um pipeline de previsão para estimar quando uma lixeira atingirá um nível crítico de preenchimento.

São utilizados dois modelos:

- **Baseline (taxa média)**: baseado na variação recente do nível
- **Regressão linear**: captura a tendência global dos dados

Além disso, o sistema pode gerar resumos explicativos usando LLM.

---

## 🚀 Instalação

```bash
pip install -r requirements.txt
