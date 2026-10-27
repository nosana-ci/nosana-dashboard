![](https://github.com/jmorganca/ollama/assets/3325447/e2ab7f70-f708-4b59-83af-6cf48f7115b5)

Mistral OpenOrca is a 7 billion parameter model, fine-tuned on top of the Mistral 7B model using the OpenOrca dataset.

HuggingFace Leaderboard evals place this model as leader for all models smaller than 30B at the release time, outperforming all other 7B and 13B models.

## Usage

### CLI

```
ollama run mistral-openorca &#34;Why is the sky blue?&#34;
```

### API

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;mistral-openorca&#34;,
  &#34;prompt&#34;: &#34;Why is the sky blue?&#34;
}'
```

## More information

- [HuggingFace repo](https://huggingface.co/Open-Orca/Mistral-7B-OpenOrca)
