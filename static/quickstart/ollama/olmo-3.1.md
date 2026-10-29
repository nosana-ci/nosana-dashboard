![Olmo3.png](https://ollama.com/assets/library/olmo-3.1/8d27e58b-a05f-4ffd-94d2-cd61a48e7303)

Olmo 3.1 models are available either as a 32B parameter thinking or instruct model. It has long chain-of-thought thinking to improve reasoning tasks like math and coding.

Olmo is a series of Open language models designed to enable the science of language models. These models are pre-trained on the Dolma 3 dataset and post-trained on the Dolci datasets. Allen AI team is releasing all code, checkpoints, logs, and associated training details.

### Models

**Olmo 3.1 Instruct 32B**

```
ollama run olmo-3.1:32b-instruct
```

**Olmo 3.1 Think 32B**

```
ollama run olmo-3.1:32b-think
```

### Benchmark

| Benchmark | Olmo 3.1 32B Think | Olmo 3 Think 32B | Qwen 3 32B | Qwen 3 VL 32B Thinking | Qwen 2.5 32B | Gemma 3 27B Instruct | Gemma 2 27B Instruct | Olmo 2 32B Instruct | DeepSeek-R1-Distill-Qwen-32B |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Math** |  |  |  |  |  |  |  |  |  |
| MATH | 96.2 | 96.1 | 95.4 | 96.7 | 80.2 | 87.4 | 51.5 | 49.2 | 92.6 |
| AIME 2024 | 80.6 | 76.8 | 80.8 | 86.3 | 15.7 | 28.9 | 4.7 | 4.6 | 70.3 |
| AIME 2025 | 78.1 | 72.5 | 70.9 | 78.8 | 13.4 | 22.9 | 0.9 | 0.9 | 56.3 |
| OMEGA | 53.4 | 50.8 | 47.7 | 50.8 | 19.2 | 24.0 | 9.1 | 9.8 | 38.9 |
| **Reasoning** |  |  |  |  |  |  |  |  |  |
| BigBenchHard | 88.6 | 89.8 | 90.6 | 91.1 | 80.9 | 82.4 | 66.0 | 65.6 | 89.7 |
| ZebraLogic | 80.1 | 76.0 | 88.3 | 96.1 | 24.1 | 24.8 | 17.2 | 13.3 | 69.4 |
| AGI Eval English | 89.2 | 88.2 | 90.0 | 92.2 | 78.9 | 76.9 | 70.9 | 68.4 | 88.1 |
| **Coding** |  |  |  |  |  |  |  |  |  |
| HumanEvalPlus | 91.5 | 91.4 | 91.2 | 90.6 | 82.6 | 79.2 | 67.5 | 44.4 | 92.3 |
| MBPP+ | 68.3 | 68.0 | 70.6 | 66.2 | 66.6 | 65.7 | 61.2 | 49.0 | 70.1 |
| LiveCodeBench v3 | 83.3 | 83.5 | 90.2 | 84.8 | 49.9 | 39.0 | 28.7 | 10.6 | 79.5 |
| **IF** |  |  |  |  |  |  |  |  |  |
| IFEval | 93.8 | 89.0 | 86.5 | 85.5 | 81.9 | 85.4 | 62.1 | 85.8 | 78.7 |
| IFBench | 68.1 | 47.6 | 37.3 | 55.1 | 36.7 | 31.3 | 27.8 | 36.4 | 23.8 |
| **Knowledge & QA** |  |  |  |  |  |  |  |  |  |
| MMLU | 86.4 | 85.4 | 88.8 | 90.1 | 84.6 | 74.6 | 76.1 | 77.1 | 88.0 |
| PopQA | 30.9 | 31.9 | 30.7 | 32.2 | 28.0 | 30.2 | 30.4 | 37.2 | 26.7 |
| GPQA | 57.5 | 58.1 | 67.3 | 67.4 | 44.6 | 45.0 | 39.9 | 36.4 | 61.8 |
| **Chat** |  |  |  |  |  |  |  |  |  |
| AlpacaEval 2 LC | 69.1 | 74.2 | 75.6 | 80.9 | 81.9 | 65.5 | 39.8 | 38.0 | 26.2 |
| **Safety** | 83.6 | 68.8 | 69.0 | 82.7 | 81.9 | 68.6 | 74.3 | 83.8 | 63.6 |
