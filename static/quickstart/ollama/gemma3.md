![Google Gemma 3 logo](https://ollama.com/assets/library/gemma3/b54bf767-f9c5-4284-b551-a49aebe3a3c2)

This model requires Ollama 0.6 or later. [Download Ollama](https://ollama.com/download)

Gemma is a lightweight, family of models from Google built on Gemini technology. The Gemma 3 models are multimodal—processing text and images—and feature a 128K context window with support for over 140 languages. Available in 270M, 1B, 4B, 12B, and 27B parameter sizes, they excel in tasks like question answering, summarization, and reasoning, while their compact design allows deployment on resource-limited devices.

## Models

### Text

**270M parameter model** (32k context window)

```
ollama run gemma3:270m
```

**1B parameter model** (32k context window)

```
ollama run gemma3:1b
```

### Multimodal (Vision)

**4B parameter model** (128k context window)

```
ollama run gemma3:4b
```

**12B parameter model** (128k context window)

```
ollama run gemma3:12b
```

**27B parameter model** (128k context window)

```
ollama run gemma3:27b
```

### Quantization aware trained models (QAT)

The quantization aware trained Gemma 3 models preserves similar quality as half precision models (BF16) while maintaining a lower memory footprint (3x less compared to non-quantized models).

**1B parameter model**

```
ollama run gemma3:1b-it-qat
```

**4B parameter model**

```
ollama run gemma3:4b-it-qat
```

**12B parameter model**

```
ollama run gemma3:12b-it-qat
```

**27B parameter model**

```
ollama run gemma3:27b-it-qat
```

## Evaluation

![Chatbot Arena ELO Score](https://ollama.com/assets/library/gemma3/89dc5a19-179e-4dd3-8e5d-12ad54973148)

### Benchmark Results

**Gemma 3 270M**

| **Benchmark** | **n-shot** | **Gemma 3 270m instruction tuned** |
| --- | --- | --- |
| [HellaSwag](https://arxiv.org/abs/1905.07830) | 0-shot | 37.7 |
| [PIQA](https://arxiv.org/abs/1911.11641) | 0-shot | 66.2 |
| [ARC-c](https://arxiv.org/abs/1911.01547) | 0-shot | 28.2 |
| [WinoGrande](https://arxiv.org/abs/1907.10641) | 0-shot | 52.3 |
| [BIG-Bench Hard](https://paperswithcode.com/dataset/bbh) | few-shot | 26.7 |
| [IF Eval](https://arxiv.org/abs/2311.07911) | 0-shot | 51.2 |

These models were evaluated against a large collection of different datasets and metrics to cover different aspects of text generation:

#### Reasoning, logic and code capabilities

| Benchmark | Metric | Gemma 3 PT 1B | Gemma 3 PT 4B | Gemma 3 PT 12B | Gemma 3 PT 27B |
| --- | --- | --- | --- | --- | --- |
| [HellaSwag](https://arxiv.org/abs/1905.07830) | 10-shot | 62.3 | 77.2 | 84.2 | 85.6 |
| [BoolQ](https://arxiv.org/abs/1905.10044) | 0-shot | 63.2 | 72.3 | 78.8 | 82.4 |
| [PIQA](https://arxiv.org/abs/1911.11641) | 0-shot | 73.8 | 79.6 | 81.8 | 83.3 |
| [SocialIQA](https://arxiv.org/abs/1904.09728) | 0-shot | 48.9 | 51.9 | 53.4 | 54.9 |
| [TriviaQA](https://arxiv.org/abs/1705.03551) | 5-shot | 39.8 | 65.8 | 78.2 | 85.5 |
| [Natural Questions](https://github.com/google-research-datasets/natural-questions) | 5-shot | 9.48 | 20.0 | 31.4 | 36.1 |
| [ARC-c](https://arxiv.org/abs/1911.01547) | 25-shot | 38.4 | 56.2 | 68.9 | 70.6 |
| [ARC-e](https://arxiv.org/abs/1911.01547) | 0-shot | 73.0 | 82.4 | 88.3 | 89.0 |
| [WinoGrande](https://arxiv.org/abs/1907.10641) | 5-shot | 58.2 | 64.7 | 74.3 | 78.8 |
| [BIG-Bench Hard](https://paperswithcode.com/dataset/bbh) |  | 28.4 | 50.9 | 72.6 | 77.7 |
| [DROP](https://arxiv.org/abs/1903.00161) | 3-shot, F1 | 42.4 | 60.1 | 72.2 | 77.2 |
| [AGIEval](https://arxiv.org/abs/2304.06364) | 3-5-shot | 22.2 | 42.1 | 57.4 | 66.2 |
| [MMLU](https://arxiv.org/abs/2009.03300) | 5-shot, top-1 | 26.5 | 59.6 | 74.5 | 78.6 |
| [MATH](https://arxiv.org/abs/2103.03874) | 4-shot | – | 24.2 | 43.3 | 50.0 |
| [GSM8K](https://arxiv.org/abs/2110.14168) | 5-shot, maj@1 | 1.36 | 38.4 | 71.0 | 82.6 |
| [GPQA](https://arxiv.org/abs/2311.12022) |  | 9.38 | 15.0 | 25.4 | 24.3 |
| [MMLU](https://arxiv.org/abs/2009.03300) (Pro) | 5-shot | 11.2 | 23.7 | 40.8 | 43.9 |
| [MBPP](https://arxiv.org/abs/2108.07732) | 3-shot | 9.80 | 46.0 | 60.4 | 65.6 |
| [HumanEval](https://arxiv.org/abs/2107.03374) | pass@1 | 6.10 | 36.0 | 45.7 | 48.8 |
| [MMLU](https://arxiv.org/abs/2009.03300) (Pro COT) | 5-shot | 9.7 | NaN | NaN | NaN |

#### Multilingual capabilities

| Benchmark | Gemma 3 PT 1B | Gemma 3 PT 4B | Gemma 3 PT 12B | Gemma 3 PT 27B |
| --- | --- | --- | --- | --- |
| [MGSM](https://arxiv.org/abs/2210.03057) | 2.04 | 34.7 | 64.3 | 74.3 |
| [Global-MMLU-Lite](https://huggingface.co/datasets/CohereForAI/Global-MMLU-Lite) | 24.9 | 57.0 | 69.4 | 75.7 |
| [Belebele](https://arxiv.org/abs/2308.16884) | 26.6 | 59.4 | 78.0 | – |
| [WMT24++](https://arxiv.org/abs/2502.12404v1) (ChrF) | 36.7 | 48.4 | 53.9 | 55.7 |
| [FloRes](https://arxiv.org/abs/2106.03193) | 29.5 | 39.2 | 46.0 | 48.8 |
| [XL-Sum](https://arxiv.org/abs/2106.13822) | 4.82 | 8.55 | 12.2 | 14.9 |
| [XQuAD](https://arxiv.org/abs/1910.11856v3) (all) | 43.9 | 68.0 | 74.5 | 76.8 |

#### Multimodal capabilities

| Benchmark | Gemma 3 PT 4B | Gemma 3 PT 12B | Gemma 3 PT 27B |
| --- | --- | --- | --- |
| [COCOcap](https://cocodataset.org/#home) | 102 | 111 | 116 |
| [DocVQA](https://www.docvqa.org/) (val) | 72.8 | 82.3 | 85.6 |
| [InfoVQA](https://arxiv.org/abs/2104.12756) (val) | 44.1 | 54.8 | 59.4 |
| [MMMU](https://arxiv.org/abs/2311.16502) (pt) | 39.2 | 50.3 | 56.1 |
| [TextVQA](https://textvqa.org/) (val) | 58.9 | 66.5 | 68.6 |
| [RealWorldQA](https://paperswithcode.com/dataset/realworldqa) | 45.5 | 52.2 | 53.9 |
| [ReMI](https://arxiv.org/html/2406.09175v1) | 27.3 | 38.5 | 44.8 |
| [AI2D](https://allenai.org/data/diagrams) | 63.2 | 75.2 | 79.0 |
| [ChartQA](https://arxiv.org/abs/2203.10244) | 45.4 | 60.9 | 63.8 |
| [ChartQA](https://arxiv.org/abs/2203.10244) (augmented) | 81.8 | 88.5 | 88.7 |
| [VQAv2](https://visualqa.org/index.html) | – | – | – |
| [BLINK](https://arxiv.org/abs/2404.12390) | 38.0 | 35.9 | 39.6 |
| [OKVQA](https://okvqa.allenai.org/) | 51.0 | 58.7 | 60.2 |
| [TallyQA](https://arxiv.org/abs/1810.12440) | 42.5 | 51.8 | 54.3 |
| [SpatialSense VQA](https://arxiv.org/abs/1908.02660) | 50.9 | 60.0 | 59.4 |
| [CountBenchQA](https://github.com/google-research/big_vision/blob/main/big_vision/datasets/countbenchqa/) | 26.1 | 17.8 | 68.0 |

## Reference

[Gemma Terms of Use](https://ai.google.dev/gemma/terms)
