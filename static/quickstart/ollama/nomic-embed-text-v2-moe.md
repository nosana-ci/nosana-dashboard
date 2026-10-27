`nomic-embed-text-v2-moe` is a multilingual MoE text embedding model that excels at multilingual retrieval.

- **High Performance**: SoTA Multilingual performance compared to ~300M parameter models, competitive with models 2x in size
- **Multilinguality**: Supports ~100 languages and trained on over 1.6B pairs
- **Flexible Embedding Dimension**: Trained with [Matryoshka Embeddings](https://arxiv.org/abs/2205.13147) with 3x reductions in storage cost with minimal performance degradations
- **Fully Open-Source**: Model weights, [code](https://github.com/nomic-ai/contrastors), and training data

| Model | Params (M) | Emb Dim | BEIR | MIRACL | Pretrain Data | Finetune Data | Code |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Nomic Embed v2** | 305 | 768 | 52.86 | **65.80** | ✅ | ✅ | ✅ |
| mE5 Base | 278 | 768 | 48.88 | 62.30 | ❌ | ❌ | ❌ |
| mGTE Base | 305 | 768 | 51.10 | 63.40 | ❌ | ❌ | ❌ |
| Arctic Embed v2 Base | 305 | 768 | **55.40** | 59.90 | ❌ | ❌ | ❌ |
|  |  |  |  |  |  |  |  |
| BGE M3 | 568 | 1024 | 48.80 | **69.20** | ❌ | ✅ | ❌ |
| Arctic Embed v2 Large | 568 | 1024 | **55.65** | 66.00 | ❌ | ❌ | ❌ |
| mE5 Large | 560 | 1024 | 51.40 | 66.50 | ❌ | ❌ | ❌ |

### Best practices

- Add appropriate prefixes to your text: For queries: “search_query: “
- For documents: “search_document: “- Maximum input length is 512 tokens

### Model Architecture

- **Total Parameters**: 475M
- **Active Parameters During Inference**: 305M
- **Architecture Type**: Mixture of Experts (MoE)
- **MoE Configuration**: 8 experts with top-2 routing
- **Embedding Dimensions**: Supports flexible dimension from 768 to 256 through Matryoshka representation learning
- **Maximum Sequence Length**: 512 tokens
- **Languages**: See below for supported languages and its training pairs per different languages

![image.png](https://ollama.com/assets/library/nomic-embed-text-v2-moe/f235fb9c-f5ee-407c-aaa1-54ea35d95e0e)
