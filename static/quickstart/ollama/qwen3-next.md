![image.png](https://ollama.com/assets/library/qwen3-next/5e94256e-8c4a-42bb-a335-34b61221360e)

Qwen3-Next-80B-A3B is the first installment in the Qwen3-Next series and features the following key enhancements:

- **Hybrid Attention**: Replaces standard attention with the combination of Gated DeltaNet and Gated Attention, enabling efficient context modeling for ultra-long context length.
- **High-Sparsity Mixture-of-Experts (MoE)**: Achieves an extreme low activation ratio in MoE layers, drastically reducing FLOPs per token while preserving model capacity.
- **Stability Optimizations**: Includes techniques such as zero-centered and weight-decayed layernorm, and other stabilizing enhancements for robust pre-training and post-training.
- **Multi-Token Prediction (MTP)**: Boosts pretraining model performance and accelerates inference.
