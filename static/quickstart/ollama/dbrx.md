![](https://github.com/ollama/ollama/assets/251292/582204f0-53c4-4e67-b710-7c503a6c8faa)

DBRX requires [Ollama 0.1.32](https://github.com/ollama/ollama/releases/tag/v0.1.32)

DBRX is a transformer-based decoder-only large language model (LLM) that was trained using next-token prediction. It uses a fine-grained mixture-of-experts (MoE) architecture with 132B total parameters of which 36B parameters are active on any input. It was pre-trained on 12T tokens of text and code data.

It is an especially capable code model, surpassing specialized models like CodeLLaMA-70B on programming, in addition to its strength as a general-purpose LLM.

## References

[Blog Post](https://www.databricks.com/blog/introducing-dbrx-new-state-art-open-llm)

[HuggingFace](https://huggingface.co/databricks/dbrx-instruct)
