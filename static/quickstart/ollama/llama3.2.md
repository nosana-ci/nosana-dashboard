![](https://ollama.com/assets/library/llama3.2/be01fadf-7fbd-404d-929b-50a77249b030)

The Meta Llama 3.2 collection of multilingual large language models (LLMs) is a collection of pretrained and instruction-tuned generative models in 1B and 3B sizes (text in/text out). The Llama 3.2 instruction-tuned text only models are optimized for multilingual dialogue use cases, including agentic retrieval and summarization tasks. They outperform many of the available open source and closed chat models on common industry benchmarks.

## Sizes

### 3B parameters (default)

The 3B model outperforms the Gemma 2 2.6B and Phi 3.5-mini models on tasks such as:

- Following instructions
- Summarization
- Prompt rewriting
- Tool use

```
ollama run llama3.2
```

### 1B parameters

The 1B model is competitive with other 1-3B parameter models. It’s use cases include:

- Personal information management
- Multilingual knowledge retrieval
- Rewriting tasks running locally on edge

```
ollama run llama3.2:1b
```

### Benchmarks

![Llama 3.2 instruction-tuned benchmarks](https://ollama.com/assets/library/llama3.2/c1a51716-d8bb-4642-8044-48f5022b777d)

**Supported Languages:** English, German, French, Italian, Portuguese, Hindi, Spanish, and Thai are officially supported. Llama 3.2 has been trained on a broader collection of languages than these 8 supported languages.
