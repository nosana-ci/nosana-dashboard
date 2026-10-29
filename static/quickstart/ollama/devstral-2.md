![](https://ollama.com/assets/library/devstral-2/22065d6d-626a-4fc8-af4c-2efe10844651)

# Devstral 2

Devstral is an agentic LLM for software engineering tasks. **Devstral 2** excels at using tools to explore codebases, editing multiple files and power software engineering agents. The model achieves remarkable performance on SWE-bench.

**[123B model](https://ollama.com/library/devstral-2)**

```
ollama run devstral-2
```

Ollama’s Cloud

```
ollama run devstral-2:123b-cloud
```

### Key Features

The Devstral 2 Instruct model offers the following capabilities:

- **Agentic Coding**: Devstral is designed to excel at agentic coding tasks, making it a great choice for software engineering agents.
- **Improved Performance**: Devstral 2 is a step-up compared to its predecessors.
- **Better Generalization**: Generalises better to diverse prompts and coding environments.

### Use Cases

AI Code Assistants, Agentic Coding, and Software Engineering Tasks. Leveraging advanced AI capabilities for complex tool integration and deep codebase understanding in coding environments.

### Benchmark Results

| Model/Benchmark | Size (B Tokens) | SWE Bench Verified | SWE Bench Multilingual | Terminal Bench |
| --- | --- | --- | --- | --- |
| **Devstral 2** | 123 | 72.2% | 61.3% | 40.5% |
| **Devstral Small 2** | 24 | 65.8% | 51.6% | 32.0% |
|  |  |  |  |  |
| DeepSeek v3.2 | 671 | 73.1% | 70.2% | 46.4% |
| Kimi K2 Thinking | 1000 | 71.3% | 61.1% | 35.7% |
| MiniMax M2 | 230 | 69.4% | 56.5% | 30.0% |
| GLM 4.6 | 455 | 68.0% | – | 40.5% |
| Qwen 3 Coder Plus | 480 | 69.6% | 54.7% | 37.5% |
| Gemini 3 Pro | – | 76.2% | – | 54.2% |
| Claude Sonnet 4.5 | – | 77.2% | 68.0% | 42.8% |
| GPT 5.1 Codex Max | – | 77.9% | – | 58.1% |
| GPT 5.1 Codex High | – | 73.7% | – | 52.8% |

### License

**[Devstral 2 - 123B](https://ollama.com/library/devstral-2)**

Modified MIT License

Attribution notice: 2025 - Mistral AI

Permission is hereby granted, free of charge, to any person obtaining a copy of the weights of this model and associated documentation files (the “Model”), to deal in the Model without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Model, and to permit persons to whom the Model is furnished to do so, subject to the following conditions:

1. The above attribution notice and this permission notice shall be included in all copies or substantial portions of the Model.
2. You are not authorized to exercise any rights under this license if the global consolidated monthly revenue of your company (or that of your employer) exceeds $20 million (or its equivalent in another currency) for the preceding month. This restriction in (b) applies to the Model and any derivatives, modifications, or combined works based on it, whether provided by Mistral AI or by a third party. You may contact Mistral AI (sales@mistral.ai) to request a commercial license, which Mistral AI may grant you at its sole discretion, or choose to use the Model on Mistral AI’s hosted services available at [https://mistral.ai/](https://mistral.ai/).

THE MODEL IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL MISTRAL AI BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE MODEL OR THE USE OR OTHER DEALINGS IN THE MODEL.

### Reference

[Devstral Small 2](https://ollama.com/library/devstral-small-2)
