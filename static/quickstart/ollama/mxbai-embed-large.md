## mxbai-embed-large

![](https://github.com/ollama/ollama/assets/251292/215cfb6a-8efa-4e9b-824d-e5f466b58c49)

As of March 2024, this model archives SOTA performance for Bert-large sized models on the MTEB. It outperforms commercial models like OpenAIs `text-embedding-3-large` model and matches the performance of model 20x its size.

`mxbai-embed-large` was trained with no overlap of the MTEB data, which indicates that the model generalizes well across several domains, tasks and text length.

## Usage

### REST API

```
curl http://localhost:11434/api/embeddings -d '{
  &#34;model&#34;: &#34;mxbai-embed-large&#34;,
  &#34;prompt&#34;: &#34;Represent this sentence for searching relevant passages: The sky is blue because of Rayleigh scattering&#34;
}'
```

### Python library

```
ollama.embeddings(model='mxbai-embed-large', prompt='Represent this sentence for searching relevant passages: The sky is blue because of Rayleigh scattering')
```

### Javascript library

```
ollama.embeddings({ model: 'mxbai-embed-large', prompt: 'Represent this sentence for searching relevant passages:  The sky is blue because of Rayleigh scattering' })
```

## References

[Blog post](https://www.mixedbread.ai/blog/mxbai-embed-large-v1)

[Hugging Face](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1)
