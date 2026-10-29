Laguna XS.2 is a 33B total parameter Mixture-of-Experts model with 3B activated parameters per token designed for agentic coding and long-horizon work on a local machine. It uses Sliding Window Attention with per-head gating in 30 out of 40 layers for fast inference and low KV cache requirements.

For more details on how we trained this model, including on data automixing and async off-policy agent RL, check out our [release blog post](https://poolside.ai/blog/laguna-a-deeper-dive).

### Highlights

- **Mixed SWA and global attention layout**: Laguna XS.2 uses sigmoid gating with per-layer rotary scales, enabling mixed SWA (Sliding Window Attention) and global attention layers in a 3:1 ratio (across 40 total layers)
- **KV cache in FP8**: KV cache quantized to FP8, reducing memory per token
- **Native reasoning support**: Interleaved thinking between tool calls with support for enabling and disabling thinking per-request
- **Local-ready**: At 33B total parameters and 3B activated, Laguna XS.2 is compact enough to run on a Mac with 36 GB of RAM. [Available on Ollama](https://ollama.com/library/laguna-xs.2)
- **Apache 2.0 license**: Use and modify freely for commercial and non-commercial purposes

### Model overview

- Training: pre-training, post-training and reinforcement learning stages
- Number of parameters: 33B total with 3B activated per token
- Optimizer: Muon
- Layers: 40 layers (10 layers with global attention, 30 layers with sliding window attention)
- Experts: 256 experts with 1 shared expert
- Sliding Window: 512 tokens
- Modality: text-to-text
- Context window: 131,072 tokens
- Reasoning support: interleaved thinking with preserved thinking

### Benchmark results

![](https://poolside.ai/assets/laguna/laguna-xs2-chart.svg)

| Model | Size (total params.) | SWE-bench Verified | SWE-bench Multilingual | SWE-bench Pro (Public Dataset) | Terminal-Bench 2.0 |
| --- | --- | --- | --- | --- | --- |
| **Laguna XS.2** | 33B | 68.2% | 62.4% | 44.5% | 30.1% |
| Devstral Small 2 | 24B dense | 68.0% | 55.7% | - | 22.5% |
| Gemma 4 31B IT | 31B dense | 52.0% | 51.7% | 35.7% | 42.9% |
| Qwen3.5-35B-A3B | 35B | 69.2% | 60.3% | 44.6% | 40.5% |
| Qwen3.6-35B-A3B | 35B | 73.4% | 67.2% | 49.5% | 51.5% |
| Claude Haiku 4.5 | - | 73.3% | - | 39.5% | 29.8% |
| GPT-5.4 Nano | - | - | - | 52.4% | 46.3% |

*We used the highest publicly-referenced scores for all comparison models across each benchmark. In almost all cases these were official scores published in release blog posts or equivalent, with the exception of Gemma 4 31B IT where the highest published scores were [reported by the Qwen team](https://qwen.ai/blog?id=qwen3.6-35b-a3b) and Claude Haiku 4.5 where the highest published (verified) scores for SWE-bench Pro and Terminal-Bench 2.0 are from their respective official leaderboards.*

### License

This model is licensed under the [Apache 2.0 License](https://huggingface.co/poolside/Laguna-XS.2/blob/main/LICENSE.md).

### Intended and Responsible Use

Laguna XS.2 is designed for software engineering and agentic coding use cases, and you are responsible for confirming that it is appropriate for your intended application. Laguna XS.2 is subject to the [Apache 2.0 License](https://huggingface.co/poolside/Laguna-XS.2/blob/main/LICENSE.md), and should be used consistently with Poolside’s [Acceptable Use Policy](https://poolside.ai/legal/acceptable-use-policy). We advise against circumventing Laguna XS.2 safety guardrails without implementing substantially equivalent mitigations appropriate for your use case.

Please report security vulnerabilities or safety concerns to [security@poolside.ai](mailto:security@poolside.ai).
