Llama 2 Uncensored is based on Meta’s Llama 2 model, and was created by George Sung and Jarrad Hope using the process defined by Eric Hartford in his [blog post](https://erichartford.com/uncensored-models).

### CLI

Open the terminal and run `ollama run llama2-uncensored`

### API

Example:

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;llama2-uncensored&#34;,
  &#34;prompt&#34;:&#34;Write a recipe for dangerously spicy mayo.&#34;
 }'
```

[API documentation](https://github.com/jmorganca/ollama/blob/main/docs/api.md)

## Memory requirements

- 7b models generally require at least 8GB of RAM
- 70b models generally require at least 64GB of RAM

## References

[https://erichartford.com/uncensored-models](https://erichartford.com/uncensored-models)

7b parameters original source: [George Sung](https://huggingface.co/georgesung/llama2_7b_chat_uncensored)

70b parameters original source: [George Sung](https://huggingface.co/jarradh/llama2_70b_chat_uncensored)
