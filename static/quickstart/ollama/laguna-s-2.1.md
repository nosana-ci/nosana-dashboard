![laguna-s-2-1-banner.svg](https://ollama.com/assets/library/laguna-s-2.1/0f2f47dd-ff7b-47ad-85dd-83c15d521055)

# Laguna S 2.1

## Overview

Laguna S 2.1 is a Mixture-of-Experts model built for agentic coding and extended reasoning. It is the larger sibling of Laguna XS 2.1, trading a bigger memory footprint for stronger coding and reasoning performance while keeping a small activated-parameter count so it stays practical to run on a single high-memory machine.

## Key Specifications

- **Total Parameters**: 118B (8B activated per token)
- **Architecture**: 48 layers with mixed attention (12 global, 36 sliding window at 512)
- **Experts**: 256 routed (top-10 per token) with 1 shared expert
- **Context Window**: 256K tokens
- **License**: OpenMDW-1.1

## Available Model Variants

| Tag | Size | Context | Type |
| --- | --- | --- | --- |
| laguna-s-2.1:latest | 75GB | 256K | Text |
| laguna-s-2.1:q4_k_m | 75GB | 256K | Text |
| laguna-s-2.1:q8_0 | 128GB | 256K | Text |
| laguna-s-2.1:f16 | 235GB | 256K | Text |

## Benchmark Results

## Technical Highlights

Sigmoid expert gating with normalised expert weights and per-layer rotary scales. Attention alternates one global layer for every three sliding-window layers, with grouped-query attention (8 KV heads) keeping the KV cache small at long context. Supports tool calling and interleaved thinking, with thinking enabled or disabled per request.

## Usage

```
ollama run laguna-s-2.1
```

Use our coding agent, [pool](https://github.com/poolsideai/pool), for the best experience.

```
POOLSIDE_STANDALONE_CONTEXT_LENGTH=262144
ollama launch pool --model laguna-s-2.1
```

Tool calling and thinking work through Ollama’s built-in template:

```
# thinking on a single request
curl http://localhost:11434/api/chat -d '{
  &#34;model&#34;: &#34;laguna-s-2.1&#34;,
  &#34;messages&#34;: [{&#34;role&#34;: &#34;user&#34;, &#34;content&#34;: &#34;If 3x+6=21, what is x?&#34;}],
  &#34;think&#34;: true
}'
```

### Hardware and settings

The q4_k_m weights need roughly 75GB of memory, so a 128GB unified-memory machine (Apple Silicon or DGX Spark) is the practical minimum, and measured single-stream decode is around 13-18 tokens/s on that class of hardware. It also runs on datacenter GPUs such as the NVIDIA H200, where far higher memory bandwidth gives correspondingly faster generation.

Two settings matter in practice:

- **Increase the load timeout.** A cold start reads 75GB from disk, which can exceed Ollama’s default 5 minute model load timeout on slower storage. Set `OLLAMA_LOAD_TIMEOUT=20m` if the first run times out.
- **Raise `num_ctx` deliberately.** Ollama defaults to a small context; long context costs memory on top of the 75GB of weights, so raise it only as far as your machine allows.

Thinking consumes output tokens before the final answer appears, so allow a generous `num_predict` on reasoning prompts or the reply can be cut off mid-thought.

## Notes

Verified on macOS (Apple Silicon, Metal), NVIDIA DGX Spark (GB10), and NVIDIA H200, with Ollama 0.31 and 0.32.
