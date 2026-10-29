![Olmo3.png](https://ollama.com/assets/library/olmo-3/16042246-aec6-47b4-a434-1a185c9d1522)

Olmo 3, a new family of 7B and 32B models in both Instruct and Think variants. It has long chain-of-thought thinking to improve reasoning tasks like math and coding.

Olmo is a series of Open language models designed to enable the science of language models. These models are pre-trained on the Dolma 3 dataset and post-trained on the Dolci datasets. Allen AI team is releasing all code, checkpoints, logs, and associated training details.

### Models

**Olmo 3 Instruct 7B**

```
ollama run olmo-3:7b-instruct
```

**Olmo 3 Think 7B**

```
ollama run olmo-3:7b-think
```

**Olmo 3 Think 32B**

```
ollama run olmo-3:32b-think
```

### Evaluation

**Olmo 3 Instruct 7B**

| **Benchmark** | **Olmo3 Instruct 7B** | **Qwen 3 8B (no reasoning)** | **Qwen 3 VL 8B Instruct** | **Qwen 2.5 7B** | **Olmo 2 7B Instruct** | **Apertus 8B Instruct** | **Granite 3.3 8B Instruct** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MATH | 87.3 | 82.3 | 91.6 | 71 | 30.1 | 21.9 | 67.3 |
| AIME 2024 | 44.3 | 26.2 | 55.1 | 11.3 | 1.3 | 0.5 | 7.3 |
| AIME 2025 | 32.5 | 21.7 | 43.3 | 6.3 | 0.4 | 0.2 | 6.3 |
| OMEGA | 28.9 | 20.5 | 32.3 | 13.7 | 5.2 | 5.0 | 10.7 |
| BigBenchHard | 71.2 | 73.7 | 85.6 | 68.8 | 43.8 | 42.2 | 61.2 |
| ZebraLogic | 32.9 | 25.4 | 64.3 | 10.7 | 5.3 | 5.3 | 17.6 |
| AGI Eval English | 64.4 | 76 | 84.5 | 69.8 | 56.1 | 50.8 | 64.0 |
| HumanEvalPlus | 77.2 | 79.8 | 82.9 | 74.9 | 25.8 | 34.4 | 64.0 |
| MBPP+ | 60.2 | 64.4 | 66.3 | 62.6 | 40.7 | 42.1 | 54.0 |
| LiveCodeBench v3 | 29.5 | 53.2 | 55.9 | 34.5 | 7.2 | 7.8 | 11.5 |
| IFEval | 85.6 | 86.3 | 87.8 | 73.4 | 72.2 | 71.4 | 77.5 |
| IFBench | 32.3 | 29.3 | 34 | 28.4 | 26.7 | 22.1 | 22.3 |
| MMLU | 69.1 | 80.4 | 83.6 | 77.2 | 61.6 | 62.7 | 63.5 |
| PopQA | 14.1 | 20.4 | 26.5 | 21.5 | 25.5 | 25.5 | 28.9 |
| GPQA | 40.4 | 44.6 | 51.1 | 35.6 | 31.3 | 28.8 | 33.0 |
| AlpacaEval 2 LC | 40.9 | 49.8 | 73.5 | 23 | 18.3 | 8.1 | 28.6 |
| SimpleQA | 79.3 | 79 | 90.3 | 78 | – | – | – |
| LitQA2 | 38.2 | 39.6 | 30.7 | 29.8 | – | – | – |
| BFCL | 49.8 | 60.2 | 66.2 | 55.8 | – | – | – |
| Safety | 87.3 | 78 | 80.2 | 73.4 | 93.1 | 72.2 | 73.7 |

**Olmo 3 Think 7B**

| Benchmark | Olmo 3 Think 7B | OpenThinker3-7B | Nemotron-Nano-9B-v2 | DeepSeek-R1-Distill-Qwen-7B | Qwen 3 8B (reasoning) | Qwen 3 VL 8B Thinker | OpenReasoning Nemotron 7B |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MATH | 95.1 | 94.5 | 94.4 | 87.9 | 95.1 | 95.2 | 94.6 |
| AIME 2024 | 71.6 | 67.7 | 72.1 | 54.9 | 74.0 | 70.9 | 77.0 |
| AIME 2025 | 64.6 | 57.2 | 58.9 | 40.2 | 67.8 | 61.5 | 73.1 |
| OMEGA | 37.8 | 38.4 | 42.4 | 28.5 | 43.4 | 38.1 | 43.2 |
| BBH | 86.6 | 77.1 | 86.2 | 73.5 | 84.4 | 86.8 | 81.3 |
| ZebraLogic | 66.5 | 34.9 | 60.8 | 26.1 | 85.2 | 91.2 | 22.4 |
| AGI Eval | 81.5 | 78.6 | 83.1 | 69.5 | 87.0 | 90.1 | 81.4 |
| HumanEval+ | 89.9 | 87.4 | 89.7 | 83.0 | 80.2 | 83.7 | 89.7 |
| MBPP+ | 64.7 | 61.4 | 66.1 | 63.5 | 69.1 | 63.0 | 61.2 |
| LCB v3 | 75.2 | 68.0 | 83.4 | 58.8 | 86.2 | 85.5 | 82.3 |
| IFEval | 88.2 | 51.7 | 86.0 | 59.6 | 87.4 | 85.5 | 42.5 |
| IFBench | 41.6 | 23.0 | 34.6 | 16.7 | 37.1 | 40.4 | 23.4 |
| MMLU | 77.8 | 77.4 | 84.3 | 67.9 | 85.4 | 86.5 | 80.7 |
| PopQA | 23.7 | 18.0 | 17.9 | 12.8 | 24.3 | 29.3 | 14.5 |
| GPQA | 46.2 | 47.6 | 56.2 | 54.4 | 57.7 | 61.5 | 56.6 |
| AE 2 | 52.1 | 24.0 | 58.0 | 7.7 | 60.5 | 73.5 | 8.6 |
|  | 70.7 | 31.3 | 72.1 | 54.0 | 68.3 | 82.9 | 30.3 |

**Olmo 3 Think 32B**

| Benchmark | Olmo 3 Think 32B | Qwen 3 32B | Qwen 3 VL 32B Thinking | Qwen 2.5 32B | Gemma 3 27B Instruct | Gemma 2 27B Instruct | Olmo 2 32B Instruct | DeepSeek-R1-Distill-Qwen-32B |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Math** |  |  |  |  |  |  |  |  |
| MATH | 96.1 | 95.4 | 96.7 | 80.2 | 87.4 | 51.5 | 49.2 | 92.6 |
| AIME 2024 | 76.8 | 80.8 | 86.3 | 15.7 | 28.9 | 4.7 | 4.6 | 70.3 |
| AIME 2025 | 72.5 | 70.9 | 78.8 | 13.4 | 22.9 | 0.9 | 0.9 | 56.3 |
| OMEGA | 50.8 | 47.7 | 50.8 | 19.2 | 24.0 | 9.1 | 9.8 | 38.9 |
| **Reasoning** |  |  |  |  |  |  |  |  |
| BigBenchHard | 89.8 | 90.6 | 91.1 | 80.9 | 82.4 | 66.0 | 65.6 | 89.7 |
| ZebraLogic | 76.0 | 88.3 | 96.1 | 24.1 | 24.8 | 17.2 | 13.3 | 69.4 |
| AGI Eval English | 88.2 | 90.0 | 92.2 | 78.9 | 76.9 | 70.9 | 68.4 | 88.1 |
| **Coding** |  |  |  |  |  |  |  |  |
| HumanEvalPlus | 91.4 | 91.2 | 90.6 | 82.6 | 79.2 | 67.5 | 44.4 | 92.3 |
| MBPP+ | 68.0 | 70.6 | 66.2 | 66.6 | 65.7 | 61.2 | 49.0 | 70.1 |
| LiveCodeBench v3 | 83.5 | 90.2 | 84.8 | 49.9 | 39.0 | 28.7 | 10.6 | 79.5 |
| **IF** |  |  |  |  |  |  |  |  |
| IFEval | 89.0 | 86.5 | 85.5 | 81.9 | 85.4 | 62.1 | 85.8 | 78.7 |
| IFBench | 47.6 | 37.3 | 55.1 | 36.7 | 31.3 | 27.8 | 36.4 | 23.8 |
| **Knowledge & QA** |  |  |  |  |  |  |  |  |
| MMLU | 85.4 | 88.8 | 90.1 | 84.6 | 74.6 | 76.1 | 77.1 | 88.0 |
| PopQA | 31.9 | 30.7 | 32.2 | 28.0 | 30.2 | 30.4 | 37.2 | 26.7 |
| GPQA | 58.1 | 67.3 | 67.4 | 44.6 | 45.0 | 39.9 | 36.4 | 61.8 |
| **Chat** |  |  |  |  |  |  |  |  |
| AlpacaEval 2 LC | 74.2 | 75.6 | 80.9 | 81.9 | 65.5 | 39.8 | 38.0 | 26.2 |
| **Safety** | 68.8 | 69.0 | 82.7 | 81.9 | 68.6 | 74.3 | 83.8 | 63.6 |
