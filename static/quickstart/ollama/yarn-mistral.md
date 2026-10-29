Yarn Mistral is a model based on [Mistral](https://ollama.ai/library/mistral) that extends its context size up to 128k context. It is developed by [Nous Research](https://nousresearch.com/) by implementing the YaRN method to further train the model to support larger context windows.

## CLI

64k context size:

```
ollama run yarn-mistral
```

128k context size:

```
ollama run yarn-mistral:7b-128k
```

## API

Example:

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;yarn-mistral:7b-128k&#34;,
  &#34;prompt&#34;:&#34;Here is a story about llamas eating grass&#34;
 }'
```

## References

[Hugging Face](https://huggingface.co/NousResearch/Yarn-Mistral-7b-64k)

[YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/pdf/2309.00071.pdf)
