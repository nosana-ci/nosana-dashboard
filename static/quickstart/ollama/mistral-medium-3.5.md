# Mistral Medium 3.5

Mistral Medium 3.5 is Mistral’s first flagship merged model. It is a dense 128B model with a 256k context window, handling instruction-following, reasoning, and coding in a single set of weights. Mistral Medium 3.5 replaces its predecessor Mistral Medium 3.1 and Magistral in Le Chat. It also replaces Devstral 2 in our coding agent Vibe. Concretely, expect better performance for instruct, reasoning and coding tasks in a new unified model in comparison with Mistral’s previous released models.

Reasoning effort is configurable per request, so the same model can answer a quick chat reply or work through a complex agentic run. We trained the vision encoder from scratch to handle variable image sizes and aspect ratios.

Find more information on [Mistral’s blog](https://mistral.ai/news/vibe-remote-agents-mistral-medium-3-5).

## Key Features

Mistral Medium 3.5 includes the following architectural choices:

- **Dense 128B parameters**.
- **256k context length**.
- **Multimodal input**: Accepts both text and image input, with text output.
- **Instruct and Reasoning functionalities** with function calls (reasoning effort configurable per request).

Mistral Medium 3.5 offers the following capabilities:

- **Reasoning Mode**: Toggle between fast instant reply mode and reasoning mode, boosting performance with test-time compute when requested.
- **Vision**: Analyzes images and provides insights based on visual content, in addition to text.
- **Multilingual**: Supports dozens of languages, including English, French, Spanish, German, Italian, Portuguese, Dutch, Chinese, Japanese, Korean, and Arabic.
- **System Prompt**: Strong adherence and support for system prompts.
- **Agentic**: Best-in-class agentic capabilities with native function calling and JSON output.
- **Large Context Window**: Supports a 256k context window.

It is released under a **Modified MIT License**: Open-source license for both commercial and non-commercial use with exceptions for companies with large revenue.

## Recommended Settings

- **Reasoning Effort**: `'none'` → Do not use reasoning
- `'high'` → Use reasoning (recommended for complex prompts and agentic usage) Use `reasoning_effort=&#34;high&#34;` for complex tasks and agentic coding.

## Benchmarks

### Agentic Benchmarks

Mistral Medium 3.5 supersedes all Mistral’s previous coding models, namely Devstral, across all benchmarks. It scores **91.4%** on τ³-Telecom and **77.6%** on SWE-Bench Verified. Due to its stronger agentic capabilities, Mistral Medium 3.5 replaces Devstral 2 in the coding agent, Vibe CLI.

![Mistral agentic benchmark](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B/resolve/main/images/image2.png) ![Mistral agentic benchmark SWE-bench](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B/resolve/main/images/image3.png) ![Mistral agentic vs competiting models benchmark](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B/resolve/main/images/image4.png)

### Instruction Following, Reasoning, and Coding Benchmarks

Mistral Medium 3.5 was also compared with competing models on instruction following, reasoning (math), and coding benchmarks. Thanks to its unified capabilities, it achieves strong results across all these tasks and Mistral Medium 3.5 is now powering Le Chat.

![instruct reasoning and agentic benchmark](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B/resolve/main/images/image1.png)
