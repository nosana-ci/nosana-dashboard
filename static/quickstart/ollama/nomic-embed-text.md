![nomic_logo](https://github.com/ollama/ollama/assets/251292/bf242e43-3c1a-4590-887d-abcab76cb304)

Note: this model requires Ollama 0.1.26 or later. [Download it here](https://ollama.com/download). It can only be used to generate embeddings.

`nomic-embed-text` is a large context length text encoder that surpasses OpenAI `text-embedding-ada-002` and `text-embedding-3-small` performance on short and long context tasks.

## Usage

This model is an embedding model, meaning it can only be used to generate embeddings.

### REST API

```
curl http://localhost:11434/api/embeddings -d '{
  &#34;model&#34;: &#34;nomic-embed-text&#34;,
  &#34;prompt&#34;: &#34;The sky is blue because of Rayleigh scattering&#34;
}'
```

### Python library

```
ollama.embeddings(model='nomic-embed-text', prompt='The sky is blue because of rayleigh scattering')
```

### Javascript library

```
ollama.embeddings({ model: 'nomic-embed-text', prompt: 'The sky is blue because of rayleigh scattering' })
```

## References

[HuggingFace](https://huggingface.co/nomic-ai/nomic-embed-text-v1.5)

[Blog Post](https://blog.nomic.ai/posts/nomic-embed-text-v1)
