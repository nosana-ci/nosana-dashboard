Llama 2 对话中文微调参数模型

这个模型是基于 Meta Platform, Inc. 所发布的 Llama 2 Chat 开源模型来进行微调。根据Meta，Llama 2 的训练数据达到了两万亿个token，上下文长度也提升到4096。对话上也是使用100万人类标记的数据微调。

由于 Llama 2 本身的中文对齐比较弱，开发者采用了中文指令集来进行微调，使其具备较强的中文对话能力。目前这个中文微调参数模型总共发布了 7B，13B两种参数大小。

Llama 2 chat chinese fine-tuned model

This model is fine-tuned based on Meta Platform’s Llama 2 Chat open source model. According to Meta, Llama 2 is trained on 2 trillion tokens, and the context length is increased to 4096. The chat model is fine-tuned using 1 million human labeled data.

Since the Chinese alignment of Llama 2 itself is relatively weak, the developer, adopted a Chinese instruction set for fine-tuning to improve the Chinese dialogue ability.

The Chinese fine-tuned models are available in 7B and 13B parameter sizes.

### CLI

Open the terminal and run `ollama run llama2-chinese`

### API

Run the model

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;llama2-chinese:7b-chat-q4_0&#34;,
  &#34;prompt&#34;:&#34;为什么天空是蓝色的&#34;
 }'
```

## Memory requirements

- 7b models generally require at least 8GB of RAM
- 13b models generally require at least 16GB of RAM

## Reference

[FlagAlpha](https://huggingface.co/FlagAlpha/Llama2-Chinese-7b-Chat)

[FlagAlpha](https://huggingface.co/FlagAlpha/Llama2-Chinese-13b-Chat)
