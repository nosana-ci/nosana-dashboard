Phi 4 reasoning and reasoning plus models are 14 billion parameter models that rival much larger models on complex reasoning tasks.

Phi 4 reasoning model is trained via supervised fine-tuning of Phi 4 on carefully curated reasoning demonstrations from OpenAI’s o3-mini. This model demonstrates meticulous data curation and high quality synthetic datasets allow smaller models to compete with larger counterparts.

Phi 4 reasoning plus model builds on top of Phi 4 reasoning, and is further trained with reinforcement learning to deliver higher accuracy.

### Models

**Phi 4 reasoning**

```
ollama run phi4-reasoning
```

**Phi 4 reasoning plus**

```
ollama run phi4-reasoning:plus
```

### Benchmarks

![image.png](https://ollama.com/assets/library/phi4-reasoning/6df829cd-a2e5-4a25-906b-29de63e072df)

Phi-4-reasoning performance across representative reasoning benchmarks spanning mathematical and scientific reasoning. We illustrate the performance gains from reasoning-focused post-training of Phi-4 via Phi-4-reasoning (SFT) and Phi-4-reasoning-plus (SFT+RL), alongside a representative set of baselines from two model families: open-weight models from DeepSeek including DeepSeek R1 (671B Mixture-of-Experts) and its distilled dense variant DeepSeek-R1 Distill Llama 70B, and OpenAI’s proprietary frontier models o1-mini and o3-mini. Phi-4-reasoning and Phi-4-reasoning-plus consistently outperform the base model Phi-4 by significant margins, exceed DeepSeek-R1 Distill Llama 70B (5x larger) and demonstrate competitive performance against significantly larger models such as Deepseek-R1.

![image.png](https://ollama.com/assets/library/phi4-reasoning/b4500c73-f2bf-4558-8391-b58e63c5ce8c)

Accuracy of models across general-purpose benchmarks for: long input context QA (FlenQA), instruction following (IFEval), Coding (HumanEvalPlus), knowledge & language understanding (MMLUPro), safety detection (ToxiGen), and other general skills (ArenaHard and PhiBench).

## References

[Blog post](https://azure.microsoft.com/en-us/blog/one-year-of-phi-small-language-models-making-big-leaps-in-ai/)
