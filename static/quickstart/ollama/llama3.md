# Llama 3

The most capable openly available LLM to date.

![](https://github.com/ollama/ollama/assets/3325447/15750d75-668c-42bd-aaf2-d0d203136d55)

Meta Llama 3, a family of models developed by Meta Inc. are new state-of-the-art , available in both **8B** and **70B** parameter sizes (pre-trained or instruction-tuned).

Llama 3 instruction-tuned models are fine-tuned and optimized for dialogue/chat use cases and outperform many of the available open-source chat models on common benchmarks.

![](https://github.com/ollama/ollama/assets/3325447/8910aebc-cd9e-4d2d-b9c2-258b5ac3eeac)

![](https://github.com/ollama/ollama/assets/3325447/f6df22a6-fd54-4aa2-876b-2b9354821ec6)

### CLI

Open the terminal and run `ollama run llama3`

### API

Example using curl:

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;llama3&#34;,
  &#34;prompt&#34;:&#34;Why is the sky blue?&#34;
 }'
```

[API documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)

## Model variants

**Instruct** is fine-tuned for chat/dialogue use cases.

*Example:* `ollama run llama3` `ollama run llama3:70b`

**Pre-trained** is the base model.

*Example:* `ollama run llama3:text` `ollama run llama3:70b-text`

## References

[Introducing Meta Llama 3: The most capable openly available LLM to date](https://ai.meta.com/blog/meta-llama-3/)
