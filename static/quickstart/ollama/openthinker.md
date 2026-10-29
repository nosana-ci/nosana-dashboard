![](https://ollama.com/assets/library/openthinker/0ef3a0d3-aae1-4855-b56b-50875e9683e8)

OpenThinker is a family of fine-tuned models from Qwen2.5 on the [OpenThoughts-114k dataset](https://huggingface.co/datasets/open-thoughts/open-thoughts-114k), surpassing DeepSeek-R1 distillation models on some benchmarks.

The dataset is derived by distilling DeepSeek-R1 using the data pipeline available on github. More info about the dataset can be found on the dataset card at OpenThoughts-114k dataset.

### Models

#### 32B

```
ollama run openthinker:32b
```

| Model Name | Dataset Size | AIME24 I/II | AIME25 I | MATH500 | GPQA Diamond | LCBv2 |
| --- | --- | --- | --- | --- | --- | --- |
| LIMO-32B | 0.8k | 56.7 | 49.3 | 86.6 | 58.1 | 60.0 |
| s1-32B | 1k | 36.0 | 25.3 | 84.8 | 50.5 | 40.9 |
| s1.1-32B | 1k | 64.7 | 49.3 | 89.0 | 60.1 | 65.5 |
| DeepSeek-R1-Distill-Qwen-32B | 800k (closed) | **76.7** | **55.9** | 89.4 | 57.6 | **71.2** |
| **OpenThinker-32B** | 114k | 66.0 | 53.3 | **90.6** | **61.6** | 68.9 |

#### 7B (default)

```
ollama run openthinker:7b
```

|  | AIME24 | MATH500 | GPQA-Diamond | LCBv2 Easy | LCBv2 Medium | LCBv2 Hard | LCBv2 All |
| --- | --- | --- | --- | --- | --- | --- | --- |
| OpenThinker-7B | 31.3 | 83.0 | 42.4 | 75.3 | 28.6 | 6.5 | 39.9 |
| Bespoke-Stratos-7B | 22.7 | 79.6 | 38.9 | 71.4 | 25.2 | 0.8 | 35.8 |
| DeepSeek-R1-Distill-Qwen-7B | 60 | 88.2 | 46.9 | 79.7 | 45.1 | 14.6 | 50.1 |
| gpt-4o-0513 | 8.7 | 75.8 | 46.5 | 87.4 | 42.7 | 8.9 | 50.5 |
| o1-mini | 64 | 85.6 | 60 | 92.8 | 74.7 | 39.8 | 72.8 |

## References

[GitHub](https://github.com/open-thoughts/open-thoughts)

[Blog post](https://www.open-thoughts.ai/blog/launch)
