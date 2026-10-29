![](https://github.com/ollama/ollama/assets/251292/4a6d8231-b7b5-411b-80b9-db37e5323cf9)

Note: this model requires Ollama 0.1.26 or later. [Download it here](https://ollama.com/download). It can only be used to generate embeddings.

The project aims to train sentence embedding models on very large sentence level datasets using a self-supervised contrastive learning objective.

## Usage

### REST API

```
curl http://localhost:11434/api/embeddings -d '{
  &#34;model&#34;: &#34;all-minilm&#34;,
  &#34;prompt&#34;: &#34;The sky is blue because of Rayleigh scattering&#34;
}'
```

### Python library

```
ollama.embeddings(model='all-minilm', prompt='The sky is blue because of Rayleigh scattering')
```

### Javascript library

```
ollama.embeddings({ model: 'all-minilm', prompt: 'The sky is blue because of Rayleigh scattering' })
```

## References

[HuggingFace](https://huggingface.co/sentence-transformers)

[Website](https://www.sbert.net/)
