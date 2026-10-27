We are currently investigating an issue using Laguna XS 2.1 on macOS. This will be updated once the issue is resolved.

# Laguna XS 2.1

Laguna XS 2.1 is a 33B total parameter Mixture-of-Experts model with 3B activated parameters per token designed for agentic coding and long-horizon work on a local machine. This model is an upgraded version of our [Laguna XS.2](https://huggingface.co/poolside/Laguna-XS.2) model with a +5.4% jump on SWE-bench Multilingual as well as stronger performance on terminal-style tasks.

For more details on how we train, including on data automixing and async off-policy agent RL, check out our recent [technical report](https://poolside.ai/assets/laguna/laguna-m1-xs2-technical-report.pdf).

## Highlights

- **Mixed SWA and global attention layout**: Laguna XS 2.1 uses sigmoid gating with per-layer rotary scales, enabling mixed SWA (Sliding Window Attention) and global attention layers in a 3:1 ratio (across 40 total layers)
- **KV cache in FP8**: KV cache quantized to FP8, reducing memory per token
- **Native reasoning support**: Interleaved thinking between tool calls with support for enabling and disabling thinking per-request
- **Local-ready**: At 33B total parameters and 3B activated, Laguna XS 2.1 is compact enough to run on a Mac with 36 GB of RAM. Available on [Ollama](https://ollama.com/library/laguna-xs-2.1) and [llama.cpp](https://github.com/ggml-org/llama.cpp/pull/25165). High-quality FP8, NVFP4 and INT4 quantized variants available ([see the collection](https://huggingface.co/collections/poolside/laguna-xs-21))
- **OpenMDW-1.1 license**: Use and modify the model and associated materials freely for commercial and non-commercial purposes ([learn more about OpenMDW](https://openmdw.ai/))

## Model overview

- Training: pre-training, post-training and reinforcement learning stages
- Number of parameters: 33B total with 3B activated per token
- Optimizer: Muon
- Layers: 40 layers (10 layers with global attention, 30 layers with sliding window attention)
- Experts: 256 experts with 1 shared expert
- Sliding Window: 512 tokens
- Modality: text-to-text
- Context window: 262,144 tokens
- Reasoning support: interleaved thinking with preserved thinking

## Benchmark results

![](https://poolside.ai/assets/laguna/laguna-xs2-1-chart.svg)

| Model | Size (total params.) | SWE-bench Verified | SWE-bench Multilingual | SWE-Bench Pro (Public Dataset) | Terminal-Bench 2.0 |
| --- | --- | --- | --- | --- | --- |
| **Laguna XS 2.1** | 33B | 70.9% | 63.1% | 47.6% | 37.5% |
| **Laguna XS.2** | 33B | 69.9% | 57.7% | 46.3% | 35.7% |
| Qwen3.6-35B-A3B | 35B | 73.4% | 67.2% | 49.5% | 51.5% |
| North Mini Code | 30B | 67.6% | - | 40.2% | 36.0% |
| MAI-Code-1-Flash | 137B | 71.6% | 65.5% | 51.2% | 54.8% |
| gpt-oss-120B | 120B | - | - | 16.2% | 18.7% |
| Claude Haiku 4.5 | - | 73.3% | - | 39.5% | 29.8% |
| GPT-5.4 Nano | - | - | - | 52.4% | 46.3% |

*We used the highest publicly-referenced scores for all comparison models across each benchmark. In all cases these were official scores published in release blog posts or equivalent, with the exception of gpt-oss-120b and Claude Haiku 4.5 where the highest published (verified) scores for SWE-Bench Pro and Terminal-Bench 2.0 are from their respective official leaderboards.*

## Usage

Laguna XS 2.1 has launch-day support in vLLM, SGLang, Transformers and Llama.cpp, and TRT-LLM thanks to the support of the team at NVIDIA.

The fastest way to get started is using OpenRouter.

We are providing free inference for a limited time for Laguna XS 2.1, as well as our larger 225B model, Laguna M.1. Visit our [provider page on OpenRouter](https://openrouter.ai/poolside/) to get started.

### pool

**pool** is a lightweight terminal-based coding agent and a dual [Agent Client Protocol](https://agentclientprotocol.com/get-started) client-server.

Download and install for macOS and Linux:

```
curl -fsSL https://downloads.poolside.ai/pool/install.sh | bash
```

Use pool with Ollama with one-command setup:

```
ollama pull laguna-xs-2.1
ollama launch pool --model laguna-xs-2.1
```

#### Feedback and issues

Submit feedback with `/feedback` and read the [full documentation on GitHub](https://github.com/poolsideai/pool).

### Local deployment

Laguna XS 2.1 is supported in vLLM, SGLang, Transformers and Llama.cpp, and TRT-LLM thanks to the support of the team at NVIDIA. Use Laguna-XS 2.1 with Ollama (with MLX support) and the mlx-lm framework for the best experience on your local machine.

#### Ollama

Available on the [Ollama library](https://ollama.com/library/laguna-xs-2.1).

```
ollama run laguna-xs-2.1          # default — Q4_K_M (imatrix)
ollama run laguna-xs-2.1:q8_0     # higher precision
ollama run laguna-xs-2.1:bf16     # full precision
```

Reasoning and tool-calling work out of the box via the built-in `laguna` template.

**macOS (Metal) users:** Chat (`ollama run` / `/api/chat`) works as expected on Linux/CUDA. On macOS/Metal it may currently return empty output; the root cause is not yet fully understood and we’re investigating it with the Ollama team. On a Mac, use a Linux/CUDA host, or the `/api/generate` endpoint with `&#34;raw&#34;: true`.

## Controlling reasoning

Laguna XS 2.1 has native reasoning support and is designed to work best with *preserved thinking*, where `reasoning` content from prior assistant messages is preserved in the message history. This model will generally reason before calling tools and between tool calls.

Reasoning may not be generated in follow-up steps if prior thinking blocks are dropped (i.e., thinking is not preserved) when messages are reconstructed over multiple steps.

### Disabling reasoning

You can disable thinking by setting `enable_thinking` to `False` in a request or by not providing `--default-chat-template-kwargs {&#34;enable_thinking&#34;: True}` or equivalent when starting the server.

For agentic coding use cases, we recommend enabling thinking and preserving reasoning in message history as outlined in the [Controlling reasoning](https://ollama.com/#controlling-reasoning) section.

## License

This model is licensed under the [OpenMDW-1.1 License](https://huggingface.co/poolside/Laguna-XS-2.1/blob/main/LICENSE.md).

## Intended and Responsible Use

Laguna XS 2.1 is designed for software engineering and agentic coding use cases, and you are responsible for confirming that it is appropriate for your intended application. Laguna XS 2.1 is subject to the [OpenMDW-1.1 License](https://huggingface.co/poolside/Laguna-XS-2.1/blob/main/LICENSE.md), and should be used consistently with Poolside’s [Acceptable Use Policy](https://poolside.ai/legal/acceptable-use-policy). We advise against circumventing Laguna XS 2.1 safety guardrails without implementing substantially equivalent mitigations appropriate for your use case.

Please report security vulnerabilities or safety concerns to [security@poolside.ai](mailto:security@poolside.ai).
