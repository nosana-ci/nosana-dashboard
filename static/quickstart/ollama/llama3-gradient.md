![](https://ollama.com/assets/library/llama3-gradient/11962db3-2750-4346-b89c-b9b5612cc76a)

This model extends LLama-3 8B’s context length from 8k to > 1040K, developed by Gradient, sponsored by compute from Crusoe Energy. It demonstrates that SOTA LLMs can learn to operate on long context with minimal training by appropriately adjusting RoPE theta. We trained on 830M tokens for this stage, and 1.4B tokens total for all stages, which is < 0.01% of Llama-3’s original pre-training data.

## Large Context Window

Note: using a 256k context window requires at least 64GB of memory. Using a 1M+ context window requires significantly more (100GB+).

To extend the context window (to 256k for example) use:

API

```
curl http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;llama3-gradient&#34;,
  &#34;prompt&#34;: &#34;Why is the sky blue?&#34;,
  &#34;options&#34;: {
    &#34;num_ctx&#34;: 256000
  }
}'
```

CLI

```
ollama run llama3-gradient
>>> /set parameter num_ctx 256000
```

## References

[Website](https://gradient.ai/)

[Hugging Face](https://huggingface.co/gradientai/Llama-3-8B-Instruct-Gradient-1048k)
