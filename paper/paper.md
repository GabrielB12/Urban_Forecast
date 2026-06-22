---
title: 'Urban Forecast: A Lightweight Forecasting Pipeline for Smart Waste Bin Monitoring in Smart Cities'
tags:
  - Python
  - IoT
  - smart cities
  - waste management
  - forecasting
  - time series
  - machine learning
authors:
  - name: Gabriel Bianchi e Silva
    affiliation: 1
    corresponding: true
  - name: Luiz Eduardo Galvão Martins
    affiliation: 1
affiliations:
  - name: Programa de Pós-Graduação em Ciência da Computação (PPG-CC), Universidade Federal de São Paulo (UNIFESP), Brazil
    index: 1
date: 19 May 2026
bibliography: paper.bib
---

# Summary

Urban Forecast is an open-source Python library that provides an end-to-end forecasting pipeline for smart waste bin monitoring using IoT sensor data.

Combining lightweight forecasting models, evaluation metrics, REST API integration, and optional LLM-based explanations, the software supports smart city applications and urban waste management optimization.

Designed with interpretability, simplicity, and ease of deployment in mind, Urban Forecast is suitable for both academic research and practical IoT environments.

This system was developed as part of an ongoing master's research project in the Programa de Pós-Graduação em Ciência da Computação (PPG-CC) at Universidade Federal de São Paulo (UNIFESP).

Its architecture integrates embedded devices based on ESP8266 microcontrollers [@esp8266] and ultrasonic sensors capable of monitoring waste levels in real time. Sensor measurements are transmitted to a Supabase database [@supabase] and processed by Urban Forecast to estimate future fill levels and support smart waste collection decisions.

These predictions can assist waste collection route optimization, reduce operational costs, prevent overflow events, and improve the allocation of collection resources.

# Statement of need

Traditional urban waste collection systems commonly operate using static collection schedules, regardless of the actual fill level of waste bins. This approach often results in inefficient routes, unnecessary fuel consumption, increased operational costs, and delayed collection in high-demand areas [@abdallah2019].

Recent advances in IoT technologies enable the deployment of smart bins capable of continuously transmitting fill-level measurements. However, converting raw sensor measurements into actionable predictive insights remains a challenge for municipalities, researchers, and smart city initiatives.

Many forecasting approaches for IoT applications rely on machine learning models and deployment architectures that can impose significant computational and operational requirements, limiting their suitability for lightweight embedded monitoring systems [@ahmed2022].

Urban Forecast addresses this problem by providing an end-to-end forecasting framework specifically designed for smart waste monitoring. Unlike general-purpose forecasting libraries, the framework integrates IoT data ingestion, lightweight forecasting models, configurable prediction pipelines, evaluation metrics, and REST API support within a unified architecture. In addition, Urban Forecast can optionally generate natural language summaries of prediction results using Large Language Models (LLMs) [@llama2023].

The software is particularly relevant for applications in smart city research, urban analytics, IoT monitoring systems, and waste management optimization. In addition, its accessible architecture makes it suitable for educational and academic environments, where forecasting methods and smart city technologies can be explored and evaluated.

Urban Forecast contributes to the field by offering a forecasting framework specifically tailored to smart waste monitoring scenarios. The project emphasizes lightweight and interpretable forecasting strategies that can operate in resource-constrained environments while integrating IoT sensing, cloud-based data persistence, and AI-assisted explainability within a unified architecture. This combination enables rapid experimentation, reproducible research, and practical deployment in smart city applications.

# State of the field

Smart waste management systems have become an important research topic within smart city initiatives [@iot2019]. Several IoT-based architectures have been proposed for monitoring urban waste containers using sensors, wireless communication, and cloud-based infrastructures [@smartCities].

Many existing systems focus primarily on data collection and monitoring dashboards while offering limited predictive capabilities. Forecasting future fill levels can significantly improve route optimization and collection efficiency, especially in large urban environments.

Machine learning and time-series forecasting approaches have been explored in urban monitoring applications, but many solutions require complex infrastructures or rely on computationally expensive models that are difficult to deploy in resource-constrained environments.

Urban Forecast focuses on providing a lightweight, modular, and easy-to-integrate forecasting pipeline suitable for both academic research and practical IoT deployments. The software emphasizes interpretability, simplicity, and ease of integration with cloud-based architectures such as Supabase.

Unlike many existing smart waste management solutions that prioritize dashboard visualization or complex deep learning architectures,
Urban Forecast focuses on lightweight and interpretable forecasting approaches that can be easily deployed in IoT scenarios with limited computational resources.

# Software design

Urban Forecast was designed using a modular architecture to facilitate experimentation with different forecasting strategies and integration with external systems.

The software receives historical time-series data, performs data preparation and forecasting, evaluates prediction quality using standard forecasting metrics, and can optionally generate natural language summaries through LLM integration.

![Architecture of the Urban Forecast framework. Historical time-series data are processed through forecasting and evaluation modules, producing prediction outputs and optional LLM-based summaries.](diagram.jpg)

The framework is organized into modular components:

- `baseline.py`: heuristic forecasting model;
- `regression.py`: linear regression forecasting model;
- `pipeline.py`: unified execution pipeline;
- `ia.py`: LLM-based explanation generation;
- `api/`: REST API integration layer.

Urban Forecast currently implements two lightweight forecasting approaches designed for smart waste monitoring scenarios. The selected methods represent different forecasting strategies while maintaining low computational requirements and straightforward interpretability, characteristics that are particularly important in IoT-based environments.

The forecasting workflow consists of collecting fill-level measurements from ultrasonic sensors, storing the data in Supabase, preprocessing historical observations, applying forecasting models, and optionally generating natural language summaries through LLM integration.


## Baseline Average Rate Model

The Baseline Average Rate model is a heuristic forecasting approach that estimates future fill levels based on the recent rate of change observed in historical measurements. The method assumes that the short-term filling behavior of a waste bin can be approximated by its most recent filling trend, making it suitable for scenarios where computational simplicity and rapid execution are required [@hyndman2021].

The model estimates the recent filling rate using the median of observed rate-of-change values within a 96-hour window, reducing sensitivity to sensor noise and isolated outlier readings while preserving the model's simplicity and interpretability. A wider window was adopted after preliminary experiments showed that a narrower 48-hour window often contained too few observations to produce a stable rate estimate, particularly for sensors with longer sampling intervals.

Because the model relies on straightforward calculations rather than parameter optimization or model training, it presents a low computational overhead and can be applied in resource-constrained environments. In addition, its transparent formulation facilitates interpretation of the generated forecasts and supports practical deployment in IoT-based monitoring systems.

## Linear Regression Model

The Linear Regression model estimates future fill levels by fitting a linear relationship between time and observed fill percentages [@james2021]. This approach captures long-term filling tendencies and provides a simple statistical framework for forecasting when waste accumulation follows an approximately linear trend.

Compared to purely heuristic approaches, linear regression can produce smoother forecasts and reduce the influence of short-term fluctuations or noisy sensor measurements. The implementation relies on a robust regression estimator (Huber loss), which limits the influence of large isolated deviations, such as those introduced by sporadic waste-disposal events, while retaining the simplicity and computational efficiency of a linear model [@huber1964]. This makes it suitable for exploratory forecasting studies and smart waste monitoring applications.

# Evaluation metrics

Urban Forecast supports commonly used forecasting metrics for evaluating prediction quality and comparing forecasting strategies.

The current implementation supports:

- Mean Absolute Error (MAE), which measures the average magnitude of prediction errors;
- Root Mean Squared Error (RMSE), which penalizes larger prediction deviations more strongly;
- Mean Absolute Percentage Error (MAPE), which measures prediction error relative to the observed values.

These metrics allow quantitative evaluation of forecasting accuracy in smart waste monitoring scenarios and support comparison between heuristic and regression-based approaches [@hyndman2006].


# Experimental evaluation

The experimental dataset contains 180 observations generated from three simulated smart waste bins based on fill-level dynamics observed in the associated IoT monitoring system based on ESP8266 microcontrollers and ultrasonic sensors, with 60 measurements per sensor.

Historical sensor measurements were retrieved from the Supabase-based data infrastructure used in the associated research project. To better approximate real-world fill-level dynamics, the dataset incorporates a non-linear filling trend, moderate measurement noise, and sporadic discrete waste-disposal events that produce localized jumps in fill level. This evaluation setup is intended to avoid overly idealized linear dynamics while preserving an underlying filling tendency that can be exploited by both forecasting approaches.

The evaluation focused on estimating the remaining time until waste bins reached a predefined fill threshold. For each sensor, predictions were generated using a walk-forward scheme: at each step, the model was trained on all observations up to a given point and evaluated against the next time at which the fill level crossed the threshold. Predictions corresponding to remaining times greater than 72 hours were discarded to avoid unstable long-horizon estimates.

The forecasting approaches were evaluated using the metrics supported by Urban Forecast, including MAE, RMSE, and MAPE [@hyndman2006]. MAPE values are reported as decimal fractions.

Table 1 summarizes the global forecasting performance of the evaluated models, including the number of evaluated predictions (N) per model. The results show that the regression-based approach achieved lower errors across all evaluation metrics.

| Model      | N  | MAE   | RMSE   | MAPE  |
| ---------- | -- | ----- | ------ | ----- |
| Baseline   | 78 | 7.966 | 10.328 | 0.243 |
| Regression | 78 | 2.503 | 3.489  | 0.108 |

The evaluated forecasting approaches presented different performance levels during the experimental evaluation. The regression-based approach achieved substantially lower errors compared to the heuristic baseline, reducing MAE from 7.966 hours to 2.503 hours and RMSE from 10.328 hours to 3.489 hours.

The obtained performance suggests that modeling the temporal evolution of the fill level provides more accurate remaining-time estimates than relying only on the median historical filling rate.

This evaluation demonstrates that lightweight forecasting approaches can provide accurate predictive estimates for smart waste monitoring scenarios while avoiding computationally expensive models and complex deployment infrastructures.

Table 2 presents the forecasting performance across individual monitored sensors, including the number of evaluated predictions (N) per sensor and model.

| Sensor | Model | N  | MAE    | RMSE   | MAPE  |
| ------ | ----- | -- | ------ | ------ | ----- |
| A1 | Baseline | 36 | 6.994 | 8.439  | 0.210 |
| A1 | Regression | 36 | 2.754 | 4.128  | 0.078 |
| A2 | Baseline | 24 | 5.121 | 6.012  | 0.191 |
| A2 | Regression | 24 | 2.253 | 2.687  | 0.122 |
| A3 | Baseline | 18 | 13.702 | 16.480 | 0.377 |
| A3 | Regression | 18 | 2.335 | 3.010  | 0.147 |

The per-sensor evaluation confirms the consistent advantage of the regression-based approach across all monitored waste bins. Sensor A3 exhibited the highest baseline error among the three sensors, suggesting that its underlying fill-level dynamics were comparatively less amenable to the simple rate-based heuristic, while the regression-based approach remained robust to this variation. Differences in N across sensors arise from the walk-forward evaluation scheme combined with the 72-hour horizon limit: sensors with longer sampling intervals produce fewer valid evaluation points within this horizon.

Figure 1 presents the relationship between predicted and real remaining time values for both evaluated forecasting approaches.

![Comparison between predicted and real remaining time estimates for the evaluated forecasting approaches.\label{fig1}](forecast_plot.png)

The regression-based approach presented predictions closer to the ideal prediction line, indicating better agreement between estimated and observed remaining time values under the evaluated monitoring conditions.

Figure 2 presents the mean absolute error of both forecasting approaches as a function of the training window size, i.e., the number of historical observations available at the time of prediction.

![Mean absolute error of the evaluated forecasting approaches as a function of the training window size.\label{fig2}](error_vs_window.png)

The regression-based approach converges to low and stable error values (typically below 5 hours) once approximately 20 training observations are available, whereas the baseline approach remains considerably more volatile across a wider range of training window sizes, with errors occasionally exceeding 15 hours. Both approaches converge to similarly low error levels once the training window approaches the full sensor history, suggesting that the regression model reaches a stable predictive regime earlier than the baseline model. This pattern is consistent with the per-sensor results, where the baseline model's accuracy is more strongly affected by sensor-specific fill-level dynamics, while the regression model maintains comparatively stable error levels across all evaluated sensors.

Additional experimental artifacts, including generated CSV reports, benchmark scripts, and visualization outputs, are publicly available in the project repository to support reproducibility and transparency.

# AI-assisted explainability

Urban Forecast optionally integrates Large Language Models (LLMs) through the Groq API to automatically generate natural language summaries of the forecasting results. This capability translates numerical outputs, forecast trends, and estimated filling trajectories into concise textual explanations that can be more easily interpreted by non-technical users.

The explainability layer is designed to complement quantitative forecasting metrics rather than replace them. By providing human-readable descriptions of predicted waste accumulation patterns, the system can support operational decision-making and facilitate communication between technical and administrative stakeholders.

This functionality is particularly useful in smart city environments, where waste management operators may benefit from rapid interpretation of forecasting outputs without requiring expertise in time-series analysis or statistical modeling. The integration leverages the Groq platform for low-latency inference and access to modern LLMs, enabling real-time generation of explanatory summaries [@groq2024].


# Research impact statement

Urban Forecast is currently being used as part of an ongoing master's research project focused on smart waste collection systems based on IoT infrastructure and cloud computing.

The project contributes to smart city research by combining embedded IoT sensing, cloud-based data persistence, lightweight forecasting models, and AI-assisted explainability within a unified framework.

The modular design allows the software to be adapted for educational purposes, research experiments, and real-world urban monitoring systems.

The software is currently being integrated into an experimental smart
waste monitoring infrastructure developed during the author's master's
research project.

# Example usage

```python
from urban_forecast.pipeline import run_pipeline
import pandas as pd

df = pd.DataFrame({
    "created_at": pd.date_range(
        start="2024-01-01",
        periods=10,
        freq="H"
    ),
    "fill_percent": [10,15,20,25,30,35,40,45,50,55]
})

result = run_pipeline(df)

print(result)
```

# AI usage disclosure
All technical content, software implementation details, experimental results, and project information presented in this manuscript were produced, reviewed, and validated by the author.

# Acknowledgements
The author thanks the Programa de Pós-Graduação em Ciência da Computação (PPG-CC) and Universidade Federal de São Paulo (UNIFESP) for supporting the associated research project.

# References
