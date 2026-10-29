![](https://ollama.com/assets/library/yi-coder/8bca5a55-79c7-4012-9d9b-371722b67d85)

Yi-Coder is excelling in long-context understanding with a maximum context length of 128K tokens. It supports 52 major programming languages.

## Sizes

- 9B: `ollama run yi-coder:9b`
- 1.5B: `ollama run yi-coder:1.5b`

## Usage

### Chat

```
ollama run yi-coder
```

### Code completion

```
curl http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;yi-coder&#34;,
  &#34;prompt&#34;: &#34;def compute_gcd(a, b):&#34;,
  &#34;suffix&#34;: &#34;    return result&#34;,
  &#34;options&#34;: {
    &#34;temperature&#34;: 0
  },
  &#34;stream&#34;: false
}'
```

## References

[Hugging Face](https://huggingface.co/01-ai/Yi-Coder-9B-Chat)

[GitHub](https://github.com/01-ai/Yi-Coder)
