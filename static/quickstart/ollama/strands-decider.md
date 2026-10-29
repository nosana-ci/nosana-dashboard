# Strands Decider

Requires [Ollama 0.40.0](https://ollama.com/download) or later on an Apple silicon Mac. These models run with MLX.

[Strands Decider](https://huggingface.co/StrandsAgents/strands-decider-2B-qwen3.5-v1-2610) is a 2B decision model from Strands Agents for classification, routing, and scoring. It uses Qwen3.5-2B-Base with a trained decision head to assign probabilities to the answers you define, without generating a free-form response.

This release uses the publisher’s **v1-2610** checkpoint. It is licensed under [Apache 2.0](https://huggingface.co/StrandsAgents/strands-decider-2B-qwen3.5-v1-2610/blob/main/LICENSE.md).

## Highlights

- **Three question types:** choose a category, answer a Boolean question, or rate an input against an ordered rubric.
- **Multiple questions per request:** assess several aspects of the same text.
- **4K context:** the formatted state and questions must fit within 4,096 tokens.
- **Compact weights:** MLX variants range from 1.3 GB to 3.8 GB.

Use it to choose a tool, route a support ticket, apply a written policy, or evaluate an answer against a rubric.

## API

Send requests to `/v1/systemone`. Put the evidence in `state` and your named questions in `questions`. The response’s `answers` object uses the same question names.

| Type | Criteria | Answer |
| --- | --- | --- |
| `choice` | Option names mapped to descriptions. | Selected `choice` and each option’s `probabilities`. |
| `noul` | Optional descriptions of `true` and `false`. | `noul`: the probability that the answer is true. |
| `score` | An array of level descriptions, in ascending order. | Probability-weighted `score`, with levels numbered from zero. |

The default model uses MXFP8:

```
ollama pull strands-decider
```

```
curl --fail-with-body -sS http://localhost:11434/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{
    &#34;model&#34;: &#34;strands-decider&#34;,
    &#34;state&#34;: &#34;Returns are allowed within 30 days. This item was bought 12 days ago. It arrived undamaged.&#34;,
    &#34;questions&#34;: {
      &#34;eligible&#34;: {
        &#34;type&#34;: &#34;noul&#34;,
        &#34;instructions&#34;: &#34;Is this item within the store return window?&#34;,
        &#34;criteria&#34;: {}
      },
      &#34;department&#34;: {
        &#34;type&#34;: &#34;choice&#34;,
        &#34;instructions&#34;: &#34;Which department handles a return?&#34;,
        &#34;criteria&#34;: {
          &#34;returns&#34;: &#34;Product returns and refunds&#34;,
          &#34;technical&#34;: &#34;Software installation&#34;
        }
      },
      &#34;damage&#34;: {
        &#34;type&#34;: &#34;score&#34;,
        &#34;instructions&#34;: &#34;How damaged was the item?&#34;,
        &#34;criteria&#34;: [&#34;Undamaged&#34;, &#34;Minor damage&#34;, &#34;Destroyed&#34;]
      }
    }
  }'
```

For this example, expect eligibility above 0.5, the `returns` department, and a damage score below 0.5. Exact probabilities vary by weight format.

## MLX variants

| Tag | Weight format | Download size |
| --- | --- | --- |
| `strands-decider`, `strands-decider:latest`, `strands-decider:2b` | MXFP8 (default) | 2.0 GB |
| `strands-decider:2b-mlx-bf16` | Unquantized BF16 | 3.8 GB |
| `strands-decider:2b-mxfp8` | MXFP8 | 2.0 GB |
| `strands-decider:2b-nvfp4` | NVFP4, with MXFP8 embeddings | 1.3 GB |

Sizes are approximate. Runtime memory also includes caches and working buffers. MLX quantization uses NVIDIA Model Optimizer and retains the decision head at its original precision.

## Evaluation

The [publisher reports](https://huggingface.co/StrandsAgents/strands-decider-2B-qwen3.5-v1-2610#results) **180⁄231 correct on JevBench**, measured with its reference implementation at a 4,096-token window.

Our separate Ollama measurements used unmodified [JevBench](https://github.com/fstandhartinger/jevbench/tree/1bcc55eb6c8cffde2306b3db03ede39b61c6152a), with all 231 original, easy, and hard cases. All requests completed without API or schema errors.

| MLX variant | Correct / 231 | Median latency | p95 latency |
| --- | --- | --- | --- |
| BF16 | 182 | 33.3 ms | 343.5 ms |
| MXFP8 | 183 | 42.5 ms | 384.8 ms |
| NVFP4 | 182 | 41.5 ms | 372.8 ms |

Measured on an Apple M5 Pro with 64 GiB RAM, macOS 27.0, and Ollama 0.40.0. Each variant had a fresh runner, one warmup request, and one serial pass through the corpus, with no competing GPU workload. Prompts ranged from 82 to 3,936 tokens. Latencies are full HTTP request times with the model loaded; fans were automatic. Different requests and hardware will produce different timings.

## Limitations

These Ollama packages support text decisions. Use the decision API; chat generation and image input are not supported.

The [publisher identifies](https://huggingface.co/StrandsAgents/strands-decider-2B-qwen3.5-v1-2610#limitations) weaknesses on long, multi-step documents and unfamiliar Boolean or scoring tasks. Changes to question wording may not change the answer as intended. Use clear options and test your actual prompts before relying on a decision threshold. The model’s calibration was fitted on short classification tasks; probabilities are not guarantees of correctness.
