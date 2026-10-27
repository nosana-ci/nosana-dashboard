Yarn Llama 2 is a model based on [Llama2](https://ollama.ai/library/llama2) that extends its context size up to 128k context. It is developed by [Nous Research](https://nousresearch.com/) by implementing the YaRN method to further train the model to support larger context windows.

## CLI

64k context size:

```
ollama run yarn-llama2
```

128k context size:

```
ollama run yarn-llama2:7b-128k
```

## API

Example:

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;yarn-llama2:7b-128k&#34;,
  &#34;prompt&#34;:&#34;Here is a story about llamas eating grass&#34;
 }'
```

## References

[Hugging Face](https://huggingface.co/NousResearch/Yarn-Llama-2-7b-64k)

[YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/pdf/2309.00071.pdf)
