![image.png](https://ollama.com/assets/library/lfm2.5-thinking/0f3b101a-f2ef-4a5c-a0bb-a8edecac35e3)

LFM2.5 is a new family of hybrid models designed for on-device deployment. It builds on the LFM2 architecture with extended pre-training and reinforcement learning.

Best-in-class performance: A 1.2B model rivaling much larger models, bringing high-quality AI to your pocket.

LFM2.5-1.2B-Thinking is a general-purpose text-only model with the following features:

- Number of parameters: 1.17B
- Number of layers: 16 (10 double-gated LIV convolution blocks + 6 GQA blocks)
- Training budget: 28T tokens
- Context length: 32,768 tokens
- Vocabulary size: 65,536
- Languages: English, Arabic, Chinese, French, German, Japanese, Korean, Spanish

### Benchmarks

We compared LFM2.5-1.2B-Thinking with relevant sub-2B models on a diverse suite of benchmarks.

| Model | GPQA Diamond | MMLU-Pro | IFEval | IFBench | Multi-IF | GSM8K | MATH-500 | AIME25 | BFCLv3 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **LFM2.5-1.2B-Thinking** | 37.86 | 49.65 | 88.42 | 44.85 | 69.33 | 85.60 | 87.96 | 31.73 | 56.97 |
| Qwen3-1.7B (thinking) | 36.93 | 56.68 | 71.65 | 25.88 | 60.33 | 85.60 | 81.92 | 36.27 | 55.41 |
| LFM2.5-1.2B-Instruct | 38.89 | 44.35 | 86.23 | 47.33 | 60.98 | 64.52 | 63.20 | 14.00 | 49.12 |
| Qwen3-1.7B (instruct) | 34.85 | 42.91 | 73.68 | 21.33 | 56.48 | 33.66 | 70.40 | 9.33 | 46.30 |
| Granite-4.0-H-1B | 24.34 | 27.64 | 80.08 | 24.93 | 47.56 | 69.60 | 47.20 | 1 | 50.69 |
| Gemma 3 1B IT | 24.24 | 14.04 | 63.25 | 20.47 | 44.31 | 42.15 | 45.20 | 1 | 16.64 |
| Llama 3.2 1B Instruct | 16.57 | 20.80 | 52.37 | 15.93 | 30.16 | 39.04 | 23.40 | 0.33 | 21.44 |
