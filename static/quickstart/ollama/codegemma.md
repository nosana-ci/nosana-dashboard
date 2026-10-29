![](https://github.com/ollama/ollama/assets/251292/56ffc5fc-0c30-4ab5-a0e3-65fc66de17bc)

CodeGemma is a collection of powerful, lightweight models that can perform a variety of coding tasks like fill-in-the-middle code completion, code generation, natural language understanding, mathematical reasoning, and instruction following.

### Variants:

- `instruct` a 7b instruction-tuned variant for natural language-to-code chat and instruction following
- `code` a 7b pretrained variant that specializes in code completion and generation from code prefixes and/or suffixes
- `2b` a state of the art 2B pretrained variant that provides up to 2x faster code completion

### Advantages:

- **Intelligent code completion and generation**: Complete lines, functions, and even generate entire blocks of code, whether you’re working locally or using Google Cloud resources.
- **Enhanced accuracy**: Trained on 500 billion tokens of primarily English language data from web documents, mathematics, and code, CodeGemma models generate code that’s not only more syntactically correct but also semantically meaningful, reducing errors and debugging time.
- **Multi-language proficiency**: Supports Python, JavaScript, Java, Kotlin, C++, C#, Rust, Go, and other languages.
- **Streamlined workflows**: Integrate a CodeGemma model into your development environment to write less boilerplate and focus on interesting and differentiated code that matters, faster.

![benchmarks](https://github.com/ollama/ollama/assets/251292/0d8473cb-bcee-4bd0-9214-c527ce367d88)

### Fill-in-the-middle

CodeGemma models support fill-in-the-middle (FIM), for use in autocomplete or coding assistant tooling. Below is an example using the Ollama [Python](https://github.com/ollama/ollama-python) library:

```
response = generate(
  model='codegemma:2b-code',
  prompt=f'<|fim_prefix|>{prefix}<|fim_suffix|>{suffix}<|fim_middle|>',
  options={
    'num_predict': 128,
    'temperature': 0,
    'top_p': 0.9,
    'stop': ['<|file_separator|>'],
  },
)
```

### References

[Hugging Face](https://huggingface.co/collections/google/codegemma-release-66152ac7b683e2667abdee11)

[Report](https://storage.googleapis.com/deepmind-media/gemma/codegemma_report.pdf)
