The Everything Language Model is a Llama 2-based model with a 16k context released by Totally Not An LLM (Kai Howard). It was trained with the [EverythingLM Dataset](https://huggingface.co/datasets/totally-not-an-llm/EverythingLM-data-V2) and is uncensored.

### CLI

`ollama run everythinglm`

Once loaded, change the context size to `16K`

```
/set parameter num_ctx 16384
```

### API

Example:

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;everythinglm&#34;,
  &#34;prompt&#34;: &#34;Why is the sky blue?&#34;
  &#34;options&#34;: {
    &#34;num_ctx&#34;: 16384
  }
 }'
```

## Reference

13b parameters original source: [Totally Not An LLM](https://huggingface.co/totally-not-an-llm/EverythingLM-13b-16k)
