![](https://user-images.githubusercontent.com/633681/264120182-4a05afc9-0003-410e-8ac5-a7745dedaba8.png)

Phind CodeLlama is a code generation model based on CodeLlama 34B fine-tuned for instruct use cases. There are two versions of the model: `v1` and `v2`. `v1` is based on CodeLlama 34B and CodeLlama-Python 34B. `v2` is an iteration on `v1`, trained on an additional 1.5B tokens of high-quality programming-related data.

## Usage

### CLI

Open the terminal and run `ollama run phind-codellama`

### API

Example

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;phind-codellama&#34;,
  &#34;prompt&#34;:&#34;Implement a linked list in C++&#34;
 }'
```

## Memory requirements

- 34b models generally require at least 32GB of RAM

## References

[Beating GPT-4 on HumanEval with a Fine-Tuned CodeLlama-34B](https://www.phind.com/blog/code-llama-beats-gpt4)

[HuggingFace](https://huggingface.co/Phind)
