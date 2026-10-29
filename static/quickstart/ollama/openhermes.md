![](https://github.com/jmorganca/ollama/assets/3325447/abc656b5-6d3b-47ef-8d1c-c0445f780168)

Open Hermes 2 a Mistral 7B fine-tuned with fully open datasets. Matching 70B models on benchmarks, this model has strong multi-turn chat skills and system prompt capabilities. In total, the model was trained on 900,000 instructions, and surpasses all previous versions of Nous-Hermes 13B and below.

### Versions

| Tag | Date | Notes |
| --- | --- | --- |
| `v2.5` `latest` | 11/02/2023 | Added ~100k examples of Code Instructions |
| `v2` | 10/16/2023 | Initial release of Open Hermes 2 |

## Usage

### CLI

```
ollama run openhermes
```

### API

Example:

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;openhermes&#34;,
  &#34;prompt&#34;: &#34;Here is a story about llamas eating grass&#34;
}'
```

## References

[Hugging Face](https://huggingface.co/teknium/OpenHermes-2.5-Mistral-7B)
