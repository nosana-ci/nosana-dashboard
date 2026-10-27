![](https://github.com/jmorganca/ollama/assets/251292/0e18bfb4-2964-41e4-b01c-043670228690)

DeepSeek Coder is trained from scratch on both 87% code and 13% natural language in English and Chinese. Each of the models are pre-trained on 2 trillion tokens.

### Models available

1.3 billion parameter model

```
ollama run deepseek-coder
```

6.7 billion parameter model

```
ollama run deepseek-coder:6.7b
```

33 billion parameter model

```
ollama run deepseek-coder:33b
```

### CLI

Open the terminal and run `ollama run deepseek-coder`

### API

Example using curl:

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;deepseek-coder&#34;,
  &#34;prompt&#34;:&#34;Why is the sky blue?&#34;
 }'
```

[API documentation](https://github.com/jmorganca/ollama/blob/main/docs/api.md)

## References

[HuggingFace](https://huggingface.co/deepseek-ai)
