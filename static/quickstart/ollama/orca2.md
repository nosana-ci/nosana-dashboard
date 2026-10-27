Orca 2 models are built by Microsoft Research. They are fine-tuned on Meta’s Llama 2 using a synthetic dataset that was created to enhance the small model’s reasoning abilities. All synthetic training data was moderated using Microsoft Azure content filters.

### Use case

Orca 2 is a helpful assistant, and provides an answer in tasks such as reasoning over your given data, reading comprehension, math problem solving and text summarization.

The model is designed to excel particularly in reasoning.

Microsoft Research’s intended purpose for this model is to encourage further research on the development, evaluation, and alignment of smaller language models.

### CLI

7 billion parameter model:

```
ollama run orca2
```

13 billion parameter model:

```
ollama run orca2:13b
```

### API

Example:

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;orca2&#34;,
  &#34;prompt&#34;:&#34;Why is the sky blue?&#34;
 }'
```

### References

- [Microsoft Research announcement blog](https://www.microsoft.com/en-us/research/blog/orca-2-teaching-small-language-models-how-to-reason/)
- Microsoft Research published paper, [Orca 2: Teaching Small Language Models How to Reason](https://arxiv.org/pdf/2311.11045.pdf)
