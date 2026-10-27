![](https://ollama.com/assets/library/deepcoder/7e57e9ba-4b82-4a7a-82f6-3ce9d4cba1c8)

Through a joint collaboration between the Agentica team and Together AI, DeepCoder-14B-Preview is a code reasoning model finetuned from Deepseek-R1-Distilled-Qwen-14B via distributed RL. It achieves an impressive 60.6% Pass@1 accuracy on LiveCodeBench (+8% improvement), matching the performance of `o3-mini-2025-01-031` (Low) and `o1-2024-12-17` with just 14B parameters

## Evaluation

| **Model** | LCB (v5)(8/1/24-2/1/25) | Codeforces Rating | Codeforces Percentile | HumanEval+ |
| --- | --- | --- | --- | --- |
| **DeepCoder-14B-Preview** | ***60.6*** | ***1936*** | ***95.3*** | ***92.6*** |
| **DeepSeek-R1-Distill-Qwen-14B** | 53.0 | 1791 | 92.7 | 92.0 |
| **O1-2024-12-17 (Low)** | 59.5 | **1991** | **96.1** | 90.8 |
| **O3-Mini-2025-1-31 (Low)** | **60.9** | 1918 | 94.9 | 92.6 |
| **O1-Preview** | 42.7 | 1658 | 88.5 | 89 |
| **Deepseek-R1** | 62.8 | 1948 | 95.4 | 92.6 |
| **Llama-4-Behemoth** | 49.4 | - | - | - |

## References

[Blog post](https://pretty-radio-b75.notion.site/DeepCoder-A-Fully-Open-Source-14B-Coder-at-O3-mini-Level-1cf81902c14680b3bee5eb349a512a51)
