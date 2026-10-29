![image.png](https://ollama.com/assets/library/muse-glimmer/f1e6359a-51e8-486f-b615-fdcd717f6766)

Muse Glimmer is a 30-billion-parameter causal language model with a dedicated perception encoder, distilled from Muse Spark and purpose-built for autonomous agentic tasks on consumer hardware. The model integrates multi-step reasoning, reliable tool use, multimodal understanding, and failure recovery into a single model that runs locally without requiring cloud infrastructure or network access.

## Get started

To download and run Muse Glimmer with Ollama, use:

```
ollama run muse-glimmer
```

Ollama’s MLX engine provides state-of-the-art performance on Apple Silicon, with support for DFlash and image input:

```
ollama run muse-glimmer:30b-mlx
```

## Model information

- **End-to-end Agentic Task Completion.** Muse Glimmer achieves strong success rates on full-task benchmarks including DeepSearch QA, MCP-Atlas, 𝛕3-Bench and SWE-Bench, which measure its ability to work within scaffolds, write and debug code, and resolve multi-turn requests from start to finish.
- **Reliable Tool Use.** The model handles a wide range of function calls, invoking tools with precise schemas throughout extended workflows.
- **Multi-Step Reasoning.** Muse Glimmer chains reasoning over long horizons, sustaining coherent plans across complex, extended workflows.
- **Failure Recovery.** When a tool call fails or returns an unexpected result, the model diagnoses the error and retries rather than halt.
- **Multimodal Input and Reasoning.** Through a dedicated perception encoder, the model accepts interleaved text and images. This enables agents to interpret screenshots, charts, and documents alongside conversation.
- **Scaffold Compatibility.** Muse Glimmer works across OpenClaw, Hermes Agent, and other agentic orchestration patterns.
- **Controllable Effort.** The model supports different reasoning strengths to select the right balance between quality and speed.
- **Multilingual.** Muse Glimmer is trained on data from more than 100 languages.

## Benchmarks

Meta evaluated Muse Glimmer across a broad range of benchmarks to assess the diverse capabilities required for effective autonomous agent behavior. Compared with Gemma4-31B and Qwen3.6-27B, Muse Glimmer performs strongly for its size class on several widely used LLM benchmarks.

| Category | Benchmark | Muse Glimmer-30B High Reasoning | Gemma4-31B Thinking Mode | Qwen3.6-27B Thinking Mode |
| --- | --- | --- | --- | --- |
| *General Agentic* | MCP Atlas (Public) | **75.5** | 54.2 | 62.5 |
|  | DeepSearch QA | **74.6** | 61.7 | 71.1 |
|  | 𝛕3-Banking | **23.5** | 15.1 | 16.7 |
|  | WildClawBench | **47.6** | 37.6 | 43.2 |
|  | GDPVal-AA v2 | 953 | 811 | **1141** |
|  | Gaia2 | **43.3** | 36.4 | 40.0 |
|  | SkillsBench (with skills) | 44.3 | 32.4 | **46.6** |
|  | OSWorld-Verified | 65.9 | 58.5 | **75.6** |
| *Agentic Coding* | SWE-Bench Pro | **51.2** | 36.9 | 50.2 |
|  | SWE-Bench Verified | 76.0 | 66.6 | **77.2** |
|  | TerminalBench 2.1 (with terminus2) | 51.7 | 43.4 | **60.7** |
|  | SciCode | **43.6** | 43.4 | 39.8 |
| *Multimodal* | Charxiv Reasoning | **78.8** | 77.7 | 78.4 |
|  | ScreenSpot Pro | 75.4 | 75.9 | **76.1** |
|  | OmniDocBench v1.5 | 75.8 | 72.5 | **77.8** |
|  | MMMU Pro | 74 | 73 | **75** |
|  |  |  |  |  |
| *Safety* | CI Memories | Violation (↓): 26.4 Coverage: 64.8 | Violation (↓): **12.1** Coverage: 53.0 | Violation (↓): 53.4 Coverage: **66.9** |
|  | Siren AgentDojo | Attack Success Rate (↓): 28.4 Utility: **94.2** | Attack Success Rate (↓): **25.6** Utility: 90.8 | Attack Success Rate (↓): 40.3 Utility: 92.7 |
|  |  |  |  |  |
| *General Capabilities and Reasoning* | IFBench | **77.0** | 76.0 | 70.8 |
|  | AIME 2026 | **94.7** | 89.2 | 94.1 |
|  | GPQA Diamond (AA) | 83.5 | **85.7** | 84.2 |
|  | HLE Text (AA) | 22.0 | **23.6** | 23.1 |
|  | AA-LCR | **80.0** | 68.3 | 73.3 |
|  | Beam128K | **65.1** | 58.2 | 63.0 |

For more detail about Meta’s evaluations, see Meta’s [report](https://research.meta.ai/static/muse-glimmer-methodology).
