![](https://ollama.com/assets/library/mistral-small3.1/88f81c26-7028-4f08-b906-92b873d5536e)

**Devstral** is an agentic LLM for software engineering tasks built under a collaboration between [Mistral AI](https://mistral.ai/) and [All Hands AI](https://www.all-hands.dev/) 🙌. Devstral excels at using tools to explore codebases, editing multiple files and power software engineering agents. The model achieves remarkable performance on SWE-bench which positionates it as the #1 open source model.

It is finetuned from Mistral Small 3.1, therefore it has a long context window of up to 128k tokens. As a coding agent, Devstral is text-only and before fine-tuning from `Mistral-Small-3.1` the vision encoder was removed.

![agentic performance](https://ollama.com/assets/library/devstral/a1ff4c01-fedd-4ce1-ad70-2dacb674add1)

### Key Features:

- **Agentic coding**: Devstral is designed to excel at agentic coding tasks, making it a great choice for software engineering agents.
- **Lightweight**: with its compact size of just 24 billion parameters, Devstral is light enough to run on a single RTX 4090 or a Mac with 32GB RAM, making it an appropriate model for local deployment and on-device use.
- **Apache 2.0 License**: Open license allowing usage and modification for both commercial and non-commercial purposes.
- **Context Window**: A 128k context window.

### SWE-Bench

Devstral achieves a score of **46.8% on SWE-Bench Verified**, outperforming prior open-source state-of-the-art by 6%.

| Model | Scaffold | SWE-Bench Verified (%) |
| --- | --- | --- |
| Devstral | OpenHands Scaffold | **46.8** |
| GPT-4.1-mini | OpenAI Scaffold | 23.6 |
| Claude 3.5 Haiku | Anthropic Scaffold | 40.6 |
| SWE-smith-LM 32B | SWE-agent Scaffold | 40.2 |

When evaluated under the same test scaffold (OpenHands, provided by All Hands AI 🙌), Devstral exceeds far larger models such as Deepseek-V3-0324 and Qwen3 232B-A22B.

In the chart below, we also compare Devstral to closed and open models evaluated under any scaffold (including ones custom for the model). Here, we find that Devstral achieves substantially better performance than a number of closed-source alternatives. For example, Devstral surpasses the recent GPT-4.1-mini by over 20%.

![Devstral comparison](https://ollama.com/assets/library/devstral/c78b6b7a-52d5-4b1f-9657-abdcb8369ef5)

### Reference

[Blog](https://mistral.ai/news/devstral)
