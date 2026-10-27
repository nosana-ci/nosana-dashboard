# 🐬 Dolphin 2.9 Llama 3

Dolphin-2.9 has a variety of instruction, conversational, and coding skills. It also has initial agentic abilities and supports function calling.

Dolphin is [uncensored](https://erichartford.com/uncensored-models). The dataset has been filtered to remove alignment and bias. This makes the model more compliant.

Curated and trained by Eric Hartford, Lucas Atkins, and Fernando Fernandes, and Cognitive Computations.

## Sizes

- `dolphin-llama3:8b`
- `dolphin-llama3:70b`

## 256K Context Window

Note: using a 256k context window requires at least 64GB of memory.

Dolphin Llama 3 also has a 256k context window version. To extend the context window use:

API

```
curl http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;dolphin-llama3:8b-256k&#34;,
  &#34;prompt&#34;: &#34;Why is the sky blue?&#34;,
  &#34;options&#34;: {
    &#34;num_ctx&#34;: 256000
  }
}'
```

CLI

```
ollama run dolphin-llama3:8b-256k
>>> /set parameter num_ctx 256000
```

## References

[HuggingFace](https://huggingface.co/cognitivecomputations/dolphin-2.9-llama3-8b)
