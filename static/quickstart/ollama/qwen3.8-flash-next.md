Qwen3.8-Flash-Next is the first open-weight model built on the architecture that will underpin Qwen4. It is a multimodal mixture-of-experts model with 125B total parameters and only 6B active per token, designed for cost-efficient inference across agentic coding, tool use, and vision tasks, with a native 256K context window.

## Highlights

- **A preview of the Qwen4 architecture**: an experimental release of Qwen’s next-generation architecture, published early so developers can prepare for the full Qwen4 family. Qwen3.8-Flash, the production model in Qwen’s API, is based on this release.
- **Sparse activation**: 125B total parameters with 6B active per token, routed across 512 experts (10 routed plus 1 shared), so per-token compute stays close to that of a small model.
- **Hybrid attention with Qwen Sparse Attention (QSA)**: Gated DeltaNet linear-attention layers are interleaved 3:1 with QSA layers that attend over micro-blocks of context rather than individual tokens, cutting long-context latency for agentic workloads.
- **N-gram embedding**: an additional 51B parameters live in a 20M-entry embedding table indexed by bigrams and trigrams. This is a new axis for scaling parameters that needs less compute than adding experts and is more amenable to offloading on memory-constrained hardware.
- **Gated residual**: element-wise, data-dependent read gates and per-branch write gates on the residual stream add expressiveness with low inference overhead.
- **256K context, extensible to 1M**: 262,144 tokens natively, extensible to 1,000,000 tokens with YaRN.
- **Thinking mode on by default**: thinking can be disabled per request, and reasoning depth can be tuned with `reasoning_effort` (`low`, `medium`, or `xhigh`). Reasoning context from historical messages is retained via `preserve_thinking`.
- **Native image and video understanding**: from STEM diagrams, charts, and documents to hour-scale videos, along with computer-use and mobile-use tasks.
- **Strong agentic coding and tool use**: outperforms Qwen3.8-27B, Qwen3.7-Plus, DeepSeek-V4-Flash, and Claude Opus 4.6 on SWE-bench Pro (62.5) and CoWorkBench (73.9), and scores 81.0 on SWE-bench Multilingual and 73.5 on Toolathlon Verified.

## Benchmarks

### Language

|  | Qwen3.8-Flash-Next | Qwen3.8-27B | Qwen3.7-Plus | DeepSeek-V4-Flash-0731 | Claude-Opus-4.6 (Max) |
| --- | --- | --- | --- | --- | --- |
| # Params | 125B | 27B | 397B | 284B | – |
| # Activated params | 6B | 27B | 17B | 13B | – |
| # N-gram embedding params | 51B | – | – | – | – |
| **Agentic coding** |  |  |  |  |  |
| DeepSWE 1.1 | **58.7** | 42.2 | 16.5 | 54.4 | – |
| SWE-bench Pro | **62.5** | 61.7 | 55.8 | 56.0 | 53.4 |
| SWE-bench Multilingual | **81.0** | 73.8 | 75.8 | – | 77.5 |
| NL2Repo-Bench | 48.1 | 42.3 | 41.1 | **54.2** | 47.6 |
| **Agentic tasks** |  |  |  |  |  |
| CoWorkBench | **73.9** | 70.7 | 65.1 | 45.1 | 68.2 |
| JobBench | **55.7** | 33.4 | 27.6 | 41.3 | 36.6 |
| Agents’ Last Exam (Pass@1 / Score) | 24.3 / **51.2** | 20.4 / 42.9 | 13.2 / 33.6 | **25.2** / – | – |
| Toolathlon Verified (Pass@1) | **73.5** | 67.1 | 50.6 | 70.3 | – |
| **General** |  |  |  |  |  |
| IFBench | **81.3** | 79.5 | 79.1 | 79.2 | 62.5 |
| GPQA Diamond | **91.7** | 89.2 | 90.3 | 90.8 | 91.3 |
| HLE | 35.9 | 30.8 | 34.7 | 33.8 | **40.0** |
| LiveCodeBench v6 | **91.9** | 90.3 | 89.6 | 90.6 | 88.8 |

### Vision Language

|  | Qwen3.8-Flash-Next | Qwen3.8-27B | Qwen3.7-Plus | Claude-Opus-4.6 (Max) |
| --- | --- | --- | --- | --- |
| **Agentic multimodal** |  |  |  |  |
| ClawEval-MM (Pass@3 / Average) | **64.4** / **60.4** | 57.4 / 56.9 | 57.4 / 60.1 | 52.5 / 54.7 |
| RecreationBench | **49.9** | 47.1 | 30.2 | – |
| AndroidWorld | **84.5** | 81.9 | 81.0 | 62.0 |
| OSWorld 2.0 (Binary / Partial) | **19.4** / **52.3** | 19.4 / 48.0 | 2.8 / 21.5 | – |
| Vision2Web | **64.0** | 62.9 | 42.1 | – |
| **General multimodal** |  |  |  |  |
| ERQA | **72.3** | 65.5 | 69.8 | 40.8 |
| LVBench | **76.6** | 72.4 | 76.2 | 63.0 |
| RealWorldQA | **88.5** | 85.9 | 86.9 | 73.9 |
| MathVision (without CI / with CI) | **90.6** / **95.7** | 90.0 / 94.6 | 90.3 / 88.7 | 65.5 / – |
| CharXiv (RQ) (without CI / with CI) | 84.6 / **90.6** | 83.7 / 90.2 | **85.8** / 85.9 | 66.0 / – |

Best results in each row are shown in bold. “–” indicates an unavailable or inapplicable score. CI refers to a code interpreter.

## References

- [Qwen blog](https://qwen.ai/blog?id=qwen3.8-flash-next)
- [Hugging Face](https://huggingface.co/Qwen/Qwen3.8-Flash-Next)
- [License: Qwen Community License 1.0](https://huggingface.co/Qwen/Qwen3.8-Flash-Next/blob/main/LICENSE)
