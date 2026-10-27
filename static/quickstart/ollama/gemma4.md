![Gemma 4 Ollama logo](https://ollama.com/assets/library/gemma4/d698dd59-9f30-44f9-81b1-a7620010c005) Gemma is a family of open models built by Google DeepMind. Gemma 4 models are multimodal, handling text and image input and generating text output.

Gemma 4 introduces key **capability and architectural advancements**:

- **Reasoning** – All models in the family are designed as highly capable reasoners, with configurable thinking modes.
- **Extended Multimodalities** – Processes Text, Image with variable aspect ratio and resolution support (all models)
- **Diverse & Efficient Architectures** – Offers Dense and Mixture-of-Experts (MoE) variants of different sizes for scalable deployment.
- **Optimized for On-Device** – Smaller models are specifically designed for efficient local execution on laptops and mobile devices.
- **Increased Context Window** – The small models feature a 128K context window, while the medium models support 256K.
- **Enhanced Coding & Agentic Capabilities** – Achieves notable improvements in coding benchmarks alongside native function-calling support, powering highly capable autonomous agents.
- **Native System Prompt Support** – Gemma 4 introduces native support for the `system` role, enabling more structured and controllable conversations.

### Models

**Ollama’s cloud**

```
ollama run gemma4:31b-cloud
```

**Edge models**

The “E” in E2B and E4B stands for “effective” parameters, and are made for edge device deployments.

**Effective 2B (E2B)**

```
ollama run gemma4:e2b
```

**Effective 4B (E4B)**

```
ollama run gemma4:e4b
```

**Workstation models**

These models are designed for frontier intelligence locally.

**12B**

```
ollama run gemma4:12b
```

**26B** (Mixture of Experts model with 4B active parameters)

```
ollama run gemma4:26b
```

**31B** (Dense)

```
ollama run gemma4:31b
```

## Benchmark Results

These models were evaluated against a large collection of different datasets and metrics to cover different aspects of text generation. Evaluation results marked in the table are for instruction-tuned models.

|  | Gemma 4 31B | Gemma 4 26B A4B | Gemma 4 E4B | Gemma 4 E2B | Gemma 3 27B (no think) |
| --- | --- | --- | --- | --- | --- |
| MMLU Pro | 85.2% | 82.6% | 69.4% | 60.0% | 67.6% |
| AIME 2026 no tools | 89.2% | 88.3% | 42.5% | 37.5% | 20.8% |
| LiveCodeBench v6 | 80.0% | 77.1% | 52.0% | 44.0% | 29.1% |
| Codeforces ELO | 2150 | 1718 | 940 | 633 | 110 |
| GPQA Diamond | 84.3% | 82.3% | 58.6% | 43.4% | 42.4% |
| Tau2 (average over 3) | 76.9% | 68.2% | 42.2% | 24.5% | 16.2% |
| HLE no tools | 19.5% | 8.7% | - | - | - |
| HLE with search | 26.5% | 17.2% | - | - | - |
| BigBench Extra Hard | 74.4% | 64.8% | 33.1% | 21.9% | 19.3% |
| MMMLU | 88.4% | 86.3% | 76.6% | 67.4% | 70.7% |
| **Vision** |  |  |  |  |  |
| MMMU Pro | 76.9% | 73.8% | 52.6% | 44.2% | 49.7% |
| OmniDocBench 1.5 (average edit distance, lower is better) | 0.131 | 0.149 | 0.181 | 0.290 | 0.365 |
| MATH-Vision | 85.6% | 82.4% | 59.5% | 52.4% | 46.0% |
| MedXPertQA MM | 61.3% | 58.1% | 28.7% | 23.5% | - |
| **Audio** |  |  |  |  |  |
| CoVoST | - | - | 35.54 | 33.47 | - |
| FLEURS (lower is better) | - | - | 0.08 | 0.09 | - |
| **Long Context** |  |  |  |  |  |
| MRCR v2 8 needle 128k (average) | 66.4% | 44.1% | 25.4% | 19.1% | 13.5% |

## Model information

| Property | E2B | E4B | 31B Dense |
| --- | --- | --- | --- |
| **Total Parameters** | 2.3B effective (5.1B with embeddings) | 4.5B effective (8B with embeddings) | 30.7B |
| **Layers** | 35 | 42 | 60 |
| **Sliding Window** | 512 tokens | 512 tokens | 1024 tokens |
| **Context Length** | 128K tokens | 128K tokens | 256K tokens |
| **Vocabulary Size** | 262K | 262K | 262K |
| **Supported Modalities** | Text, Image, Audio | Text, Image, Audio | Text, Image |
| **Vision Encoder Parameters** | *~150M* | *~150M* | *~550M* |
| **Audio Encoder Parameters** | *~300M* | *~300M* | No Audio |

### Mixture-of-Experts (MoE) Model

| Property | 26B A4B MoE |
| --- | --- |
| **Total Parameters** | 25.2B |
| **Active Parameters** | 3.8B |
| **Layers** | 30 |
| **Sliding Window** | 1024 tokens |
| **Context Length** | 256K tokens |
| **Vocabulary Size** | 262K |
| **Expert Count** | 8 active / 128 total and 1 shared |
| **Supported Modalities** | Text, Image |
| **Vision Encoder Parameters** | *~550M* |

## Best Practices

For the best performance, use these configurations and best practices:

### 1. Sampling Parameters

Use the following standardized sampling configuration across all use cases:

- `temperature=1.0`
- `top_p=0.95`
- `top_k=64`

### 2. Thinking Mode Configuration

Note that Ollama already handles the complexities of the chat template for you.

Compared to Gemma 3, the models use standard `system`, `assistant`, and `user` roles. To properly manage the thinking process, use the following control tokens:

- **Trigger Thinking:** Thinking is enabled by including the `<|think|>` token at the start of the system prompt. To disable thinking, remove the token.
- **Standard Generation:** When thinking is enabled, the model will output its internal reasoning followed by the final answer using this structure: `<|channel>thought\n`**[Internal reasoning]**`<channel|>`
- **Disabled Thinking Behavior:** For all models except for the E2B and E4B variants, if thinking is disabled, the model will still generate the tags but with an empty thought block: `<|channel>thought\n<channel|>`**[Final answer]**

### 3. Multi-Turn Conversations

- **No Thinking Content in History**: In multi-turn conversations, the historical model output should only include the final response. Thoughts from previous model turns must *not be added* before the next user turn begins.

### 4. Modality order

- For optimal performance with multimodal inputs, place image and/or audio content **before** the text in your prompt.

### 5. Variable Image Resolution

Aside from variable aspect ratios, Gemma 4 supports variable image resolution through a configurable visual token budget, which controls how many tokens are used to represent an image. A higher token budget preserves more visual detail

at the cost of additional compute, while a lower budget enables faster inference for tasks that don’t require fine-grained understanding.

- The supported token budgets are: **70**, **140**, **280**, **560**, and **1120**. Use *lower budgets* for classification, captioning, or video understanding, where faster inference and processing many frames outweigh fine-grained detail.
- Use *higher budgets* for tasks like OCR, document parsing, or reading small text.
