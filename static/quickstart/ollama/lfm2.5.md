![image.png](https://ollama.com/assets/library/lfm2.5-thinking/0f3b101a-f2ef-4a5c-a0bb-a8edecac35e3)

LFM2.5 is a family of hybrid models from Liquid AI designed for on-device deployment. It builds on the LFM2 architecture with extended pre-training and reinforcement learning.

### LFM2.5-24B-A2B

The largest and final model in the LFM2.5 family: a 24B reasoning model that activates only about 2B parameters per token, built for fast, private agents on your own hardware.

```
ollama run lfm2.5:24b
```

- **Built for agents**: Trained with reinforcement learning inside popular agent harnesses. Liquid AI reports a LiveClaw score of 48.09, ahead of Qwen3.6-35B-A3B (38.19), a model with about 50% more parameters.
- **Always reasons**: Thinks before every answer, and with only 2B active parameters each reasoning token is cheap.
- **Long context**: 128K tokens.
- **Multilingual**: English, Arabic, Chinese, French, German, Italian, Japanese, Korean, Portuguese, Spanish, Vietnamese, Thai, Indonesian, Hindi, Russian and Polish.

Use it for agents that reason and call tools. For knowledge-heavy questions, pair it with web search or retrieval.

### Use it with your agent

Liquid AI trained LFM2.5-24B-A2B inside OpenClaw, Hermes Agent, Pi and OpenCode. Start any of them with Ollama:

```
ollama launch opencode --model lfm2.5:24b
```

```
ollama launch hermes --model lfm2.5:24b
```

### LFM2.5-8B-A1B

An edge model built for fast, reliable tool calling on consumer hardware.

```
ollama run lfm2.5:8b
```

- **On-device personal assistant**: Designed to power real-life applications, chaining tool calls, and following complex instructions on all devices.
- **Compressed performance**: Competitive with much larger dense and MoE models on instruction following and agentic tasks.
- **Unmatched throughput**: Fastest in its size class on both CPU and GPU inference

![benchmark](https://ollama.com/assets/library/lfm2.5/2eecda91-5cc6-4212-9382-25e05b6e68ad)
