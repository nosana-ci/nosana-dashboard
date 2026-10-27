![](https://ollama.com/assets/library/qwen3.5/b6074711-2930-4f09-93b7-4f65ae7a3576)

Over recent months, we have intensified our focus on developing foundation models that deliver exceptional utility and performance. Qwen3.5 represents a significant leap forward, integrating breakthroughs in multimodal learning, architectural efficiency, reinforcement learning scale, and global accessibility to empower developers and enterprises with unprecedented capability and efficiency.

## Highlights

Qwen3.5 features the following enhancement:

- **Unified Vision-Language Foundation**: Early fusion training on multimodal tokens achieves cross-generational parity with Qwen3 and outperforms Qwen3-VL models across reasoning, coding, agents, and visual understanding benchmarks.
- **Efficient Hybrid Architecture**: Gated Delta Networks combined with sparse Mixture-of-Experts deliver high-throughput inference with minimal latency and cost overhead.
- **Scalable RL Generalization**: Reinforcement learning scaled across million-agent environments with progressively complex task distributions for robust real-world adaptability.
- **Global Linguistic Coverage**: Expanded support to 201 languages and dialects, enabling inclusive, worldwide deployment with nuanced cultural and regional understanding.
- **Next-Generation Training Infrastructure**: Near-100% multimodal training efficiency compared to text-only training and asynchronous RL frameworks supporting massive-scale agent scaffolds and environment orchestration.

## Benchmarks

![benchmark](https://ollama.com/assets/library/qwen3.5/1c5d9a27-97b2-4d6d-a1b1-d326259acae5)

### Language

|  | GPT5.2 | Claude 4.5 Opus | Gemini-3 Pro | Qwen3-Max-Thinking | K2.5-1T-A32B | Qwen3.5-397B-A17B |
| --- | --- | --- | --- | --- | --- | --- |
| Knowledge |
| MMLU-Pro | 87.4 | 89.5 | 89.8 | 85.7 | 87.1 | 87.8 |
| MMLU-Redux | 95.0 | 95.6 | 95.9 | 92.8 | 94.5 | 94.9 |
| SuperGPQA | 67.9 | 70.6 | 74.0 | 67.3 | 69.2 | 70.4 |
| C-Eval | 90.5 | 92.2 | 93.4 | 93.7 | 94.0 | 93.0 |
| Instruction Following |
| IFEval | 94.8 | 90.9 | 93.5 | 93.4 | 93.9 | 92.6 |
| IFBench | 75.4 | 58.0 | 70.4 | 70.9 | 70.2 | 76.5 |
| MultiChallenge | 57.9 | 54.2 | 64.2 | 63.3 | 62.7 | 67.6 |
| Long Context |
| AA-LCR | 72.7 | 74.0 | 70.7 | 68.7 | 70.0 | 68.7 |
| LongBench v2 | 54.5 | 64.4 | 68.2 | 60.6 | 61.0 | 63.2 |
| STEM |
| GPQA | 92.4 | 87.0 | 91.9 | 87.4 | 87.6 | 88.4 |
| HLE | 35.5 | 30.8 | 37.5 | 30.2 | 30.1 | 28.7 |
| HLE-Verified¹ | 43.3 | 38.8 | 48 | 37.6 | -- | 37.6 |
| Reasoning |
| LiveCodeBench v6 | 87.7 | 84.8 | 90.7 | 85.9 | 85.0 | 83.6 |
| HMMT Feb 25 | 99.4 | 92.9 | 97.3 | 98.0 | 95.4 | 94.8 |
| HMMT Nov 25 | 100 | 93.3 | 93.3 | 94.7 | 91.1 | 92.7 |
| IMOAnswerBench | 86.3 | 84.0 | 83.3 | 83.9 | 81.8 | 80.9 |
| AIME26 | 96.7 | 93.3 | 90.6 | 93.3 | 93.3 | 91.3 |
| General Agent |
| BFCL-V4 | 63.1 | 77.5 | 72.5 | 67.7 | 68.3 | 72.9 |
| TAU2-Bench | 87.1 | 91.6 | 85.4 | 84.6 | 77.0 | 86.7 |
| VITA-Bench | 38.2 | 56.3 | 51.6 | 40.9 | 41.9 | 49.7 |
| DeepPlanning | 44.6 | 33.9 | 23.3 | 28.7 | 14.5 | 34.3 |
| Tool Decathlon | 43.8 | 43.5 | 36.4 | 18.8 | 27.8 | 38.3 |
| MCP-Mark | 57.5 | 42.3 | 53.9 | 33.5 | 29.5 | 46.1 |
| Search Agent³ |
| HLE w/ tool | 45.5 | 43.4 | 45.8 | 49.8 | 50.2 | 48.3 |
| BrowseComp | 65.8 | 67.8 | 59.2 | 53.9 | --/74.9 | 69.0/78.6 |
| BrowseComp-zh | 76.1 | 62.4 | 66.8 | 60.9 | -- | 70.3 |
| WideSearch | 76.8 | 76.4 | 68.0 | 57.9 | 72.7 | 74.0 |
| Seal-0 | 45.0 | 47.7 | 45.5 | 46.9 | 57.4 | 46.9 |
| Multilingualism |
| MMMLU | 89.5 | 90.1 | 90.6 | 84.4 | 86.0 | 88.5 |
| MMLU-ProX | 83.7 | 85.7 | 87.7 | 78.5 | 82.3 | 84.7 |
| NOVA-63 | 54.6 | 56.7 | 56.7 | 54.2 | 56.0 | 59.1 |
| INCLUDE | 87.5 | 86.2 | 90.5 | 82.3 | 83.3 | 85.6 |
| Global PIQA | 90.9 | 91.6 | 93.2 | 86.0 | 89.3 | 89.8 |
| PolyMATH | 62.5 | 79.0 | 81.6 | 64.7 | 43.1 | 73.3 |
| WMT24++ | 78.8 | 79.7 | 80.7 | 77.6 | 77.6 | 78.9 |
| MAXIFE | 88.4 | 79.2 | 87.5 | 84.0 | 72.8 | 88.2 |
| Coding Agent |
| SWE-bench Verified | 80.0 | 80.9 | 76.2 | 75.3 | 76.8 | 76.2 |
| SWE-bench Multilingual | 72.0 | 77.5 | 65.0 | 66.7 | 73.0 | 69.3 |
| SecCodeBench | 68.7 | 68.6 | 62.4 | 57.5 | 61.3 | 68.3 |
| Terminal Bench 2 | 54.0 | 59.3 | 54.2 | 22.5 | 50.8 | 52.5 |

* HLE-Verified: a verified and revised version of Humanity’s Last Exam (HLE), accompanied by a transparent, component-wise verification protocol and a fine-grained error taxonomy. We open-source the dataset at https://huggingface.co/datasets/skylenage/HLE-Verified. * TAU2-Bench: we follow the official setup except for the airline domain, where all models are evaluated by applying the fixes proposed in the Claude Opus 4.5 system card. * MCPMark: GitHub MCP server uses v0.30.3 from api.githubcopilot.com; Playwright tool responses are truncated at 32k tokens. * Search Agent: most search agents built on our model adopt a simple context-folding strategy(256k): once the cumulative Tool Response length reaches a preset threshold, earlier Tool Responses are pruned from the history to keep the context within limits. * BrowseComp: we tested two strategies, simple context-folding achieved a score of 69.0, while using the same discard-all strategy as DeepSeek-V3.2 and Kimi K2.5 achieved 78.6. * WideSearch: we use a 256k context window without any context management. * MMLU-ProX: we report the averaged accuracy on 29 languages. * WMT24++: a harder subset of WMT24 after difficulty labeling and rebalancing; we report the averaged scores on 55 languages using XCOMET-XXL. * MAXIFE: we report the accuracy on English + multilingual original prompts (totally 23 settings). * Empty cells (--) indicate scores not yet available or not applicable.
