![Qwen 3 logo](https://ollama.com/assets/library/qwen3/a5541098-87ba-4184-a5af-2b63312c2522) **Qwen3-Coder** is the most agentic code model to date in the Qwen series.

### Get started

**480B**

Cloud

```
ollama run qwen3-coder:480b-cloud
```

Local

```
ollama run qwen3-coder:480b
```

Running locally requires a minimum of 250GB of memory or unified memory.

**30B**

```
ollama run qwen3-coder:30b
```

### Overview

`qwen3-coder:30b` offers 30B total parameters with only 3.3B activated, delivering strong performance while maintaining efficiency.

- Exceptional agentic capabilities for real-world software engineering tasks through advanced long-horizon reinforcement learning on SWE-Bench and similar benchmarks.
- Long context support with 256K tokens natively and up to 1M tokens using extrapolation methods, optimized for repository-scale understanding.
- Scaled pretraining on 7.5T tokens (70% code ratio) while preserving strong general and mathematical abilities.
- Execution-driven reinforcement learning that significantly boosts code execution success rates across diverse real-world coding tasks.

![image.png](https://ollama.com/assets/library/qwen3-coder/52070971-5a66-4947-90a0-5e983a5809e7)

### Reference

- [Blog](https://qwenlm.github.io/blog/qwen3-coder/)
