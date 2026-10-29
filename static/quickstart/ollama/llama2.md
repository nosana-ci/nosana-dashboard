![](https://github.com/jmorganca/ollama/assets/3325447/286e4e13-0b2b-43a4-9b07-23a50d3a3d33)

Llama 2 is released by Meta Platforms, Inc. This model is trained on 2 trillion tokens, and by default supports a context length of 4096. Llama 2 Chat models are fine-tuned on over 1 million human annotations, and are made for chat.

### CLI

Open the terminal and run `ollama run llama2`

### API

Example using curl:

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;llama2&#34;,
  &#34;prompt&#34;:&#34;Why is the sky blue?&#34;
 }'
```

[API documentation](https://github.com/jmorganca/ollama/blob/main/docs/api.md)

## Memory requirements

- 7b models generally require at least 8GB of RAM
- 13b models generally require at least 16GB of RAM
- 70b models generally require at least 64GB of RAM

If you run into issues with higher quantization levels, try using the q4 model or shut down any other programs that are using a lot of memory.

## Model variants

**Chat** is fine-tuned for chat/dialogue use cases. These are the default in Ollama, and for models tagged with -chat in the tags tab.

*Example: `ollama run llama2`*

**Pre-trained** is without the chat fine-tuning. This is tagged as -text in the tags tab.

*Example: `ollama run llama2:text`*

By default, Ollama uses 4-bit quantization. To try other quantization levels, please try the other tags. The number after the q represents the number of bits used for quantization (i.e. q4 means 4-bit quantization). The higher the number, the more accurate the model is, but the slower it runs, and the more memory it requires.

## References

[Llama 2: Open Foundation and Fine-Tuned Chat Models](https://arxiv.org/abs/2307.09288)

[Meta’s Hugging Face repo](https://huggingface.co/meta-llama)
