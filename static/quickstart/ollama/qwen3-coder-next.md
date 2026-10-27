![](https://ollama.com/assets/library/qwen3-coder-next/dbbd2b20-4b43-4d02-9cfe-e83a63cabae8)

Built on top of Qwen3-Next-80B-A3B-Base, which adopts a novel architecture with hybrid attention and MoE, Qwen3-Coder-Next has been agentically trained at scale on large-scale executable task synthesis, environment interaction, and reinforcement learning, obtaining strong coding and agentic capabilities with significantly lower inference costs.

![image.png](https://ollama.com/assets/library/qwen3-coder-next/7d9b5395-c335-48b9-b8c5-7e5090abbb8e)

### Features

- **Ultra-efficient inference:** 80B total parameters, 3B active per token. Runs on consumer hardware with quantization.
- **256K native context:** Full repository-scale understanding without chunking or retrieval hacks.
- **Agentic training:** Trained on 800K executable tasks with environment interaction and reinforcement learning—not just static code-text pairs.
- **Tool calling:** Works with coding agents like Claude Code, Qwen Code, Cline, and OpenCode out of the box.
- **Non-thinking mode only:** Fast responses without `<think></think>` blocks.

### Benchmarks

![](https://ollama.com/assets/library/qwen3-coder-next/d978a788-2fa4-44ea-832c-20cd82202a6c)
