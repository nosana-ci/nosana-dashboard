![](https://user-images.githubusercontent.com/633681/263123848-e99cc861-483d-4b53-a8ce-5d9c372d343b.png)

Wizard Vicuna is a 13B parameter model based on Llama 2 trained by MelodysDreamj.

### CLI

Open the terminal and run `ollama run wizard-vicuna`

### API

Example:

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;wizard-vicuna&#34;,
  &#34;prompt&#34;:&#34;Why is the sky blue?&#34;
 }'
```

## Memory requirements

- 13b models generally require at least 16GB of RAM

## Reference

[The Bloke](https://huggingface.co/TheBloke/wizard-vicuna-13B-GGML)

[MelodysDreamj](https://huggingface.co/junelee/wizard-vicuna-13b)
