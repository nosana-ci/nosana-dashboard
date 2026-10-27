NVIDIA Nemotron™ is a family of open models with open weights, training data, and recipes, delivering leading efficiency and accuracy for building specialized AI agents.

**Nemotron-3-Super** is a large language model (LLM) trained by NVIDIA, designed to deliver strong agentic, reasoning, and conversational capabilities. It is optimized for collaborative agents and high-volume workloads such as IT ticket automation. Like other models in the family, it responds to user queries and tasks by first generating a reasoning trace and then concluding with a final response. The model’s reasoning capabilities can be configured through a flag in the chat template.

The model has **12B active parameters** and **120B parameters in total**.

The supported languages include: English, French, German, Italian, Japanese, Spanish, and Chinese

This model is ready for commercial use.

![nemotron 3 super](https://ollama.com/assets/library/nemotron-3-super/b619e32c-068a-4a31-aa5d-1b4f893ba360)

### Benchmarks

| **Benchmark** | **Nemotron 3 Super** | **Qwen3.5-122B-A10B** | **GPT-OSS-120B** |
| --- | --- | --- | --- |
| **General Knowledge** |  |  |  |
| MMLU-Pro | 83.73 | 86.70 | 81.00 |
| **Reasoning** |  |  |  |
| AIME25 (no tools) | 90.21 | 90.36 | 92.50 |
| HMMT Feb25 (no tools) | 93.67 | 91.40 | 90.00 |
| HMMT Feb25 (with tools) | 94.73 | 89.55 | — |
| GPQA (no tools) | 79.23 | 86.60 | 80.10 |
| GPQA (with tools) | 82.70 | — | 80.09 |
| LiveCodeBench (v5 2024-07 to 2024-12) | 81.19 | 78.93 | 88.00 |
| SciCode (subtask) | 42.05 | 42.00 | 39.00 |
| HLE (no tools) | 18.26 | 25.30 | 14.90 |
| HLE (with tools) | 22.82 | — | 19.0 |
| **Agentic** |  |  |  |
| Terminal Bench (hard subset) | 25.78 | 26.80 | 24.00 |
| Terminal Bench Core 2.0 | 31.00 | 37.50 | 18.70 |
| SWE-Bench (OpenHands) | 60.47 | 66.40 | 41.9 |
| SWE-Bench (OpenCode) | 59.20 | 67.40 | — |
| SWE-Bench (Codex) | 53.73 | 61.20 | — |
| SWE-Bench Multilingual (OpenHands) | 45.78 | — | 30.80 |
| **TauBench V2** |  |  |  |
| Airline | 56.25 | 66.0 | 49.2 |
| Retail | 62.83 | 62.6 | 67.80 |
| Telecom | 64.36 | 95.00 | 66.00 |
| Average | 61.15 | 74.53 | 61.0 |
| BrowseComp with Search | 31.28 | — | 33.89 |
| BIRD Bench | 41.80 | — | 38.25 |
| **Chat & Instruction Following** |  |  |  |
| IFBench (prompt) | 72.56 | 73.77 | 68.32 |
| Scale AI Multi-Challenge | 55.23 | 61.50 | 58.29 |
| Arena-Hard-V2 | 73.88 | 75.15 | 90.26 |
| **Long Context** |  |  |  |
| AA-LCR | 58.31 | 66.90 | 51.00 |
| RULER @ 256k | 96.30 | 96.74 | 52.30 |
| RULER @ 512k | 95.67 | 95.95 | 46.70 |
| RULER @ 1M | 91.75 | 91.33 | 22.30 |
| **Multilingual** |  |  |  |
| MMLU-ProX (avg over langs) | 79.36 | 85.06 | 76.59 |
| WMT24++ (en→xx) | 86.67 | 87.84 | 88.89 |
