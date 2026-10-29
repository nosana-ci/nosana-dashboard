# Nimble v3

Requires [Ollama 0.40.4](https://ollama.com/download) or later.

[Nimble v3](https://huggingface.co/bespokelabs/Bespoke-Nimble-9B-v3) is a 9B decision model from Bespoke Labs, fine-tuned from Qwen3.5-9B.

Give it the relevant facts and questions with defined answers. It returns probabilities for those answers, letting your application route a request, check a condition, or assign a rating. It scores candidate answer tokens directly, without generating a reasoning trace or a free-form response.

**Noncommercial use only.** Nimble v3 is licensed under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/), unlike the earlier [`nimble`](https://ollama.com/library/nimble) release. The [Qwen3.5-9B base](https://huggingface.co/Qwen/Qwen3.5-9B) is separately licensed under Apache 2.0. See the [publisher’s license statement](https://huggingface.co/bespokelabs/Bespoke-Nimble-9B-v3#license).

```
ollama pull nimble-v3
```

## Highlights

- **Three question types:** categorical choices, Boolean questions, and ordered rubric scores.
- **Multiple questions per request:** evaluate several aspects of the same input.
- **32K text context:** up to 32,768 tokens, including the formatted questions.
- **MLX and GGUF:** automatic backend selection, with unquantized and smaller quantized variants available.

## API

Send requests to Ollama’s `/v1/systemone` endpoint. Put the evidence in `state` and name each question in `questions`. Ollama formats the model’s prompt and returns an `answers` object using those names.

| Type | Criteria | Result |
| --- | --- | --- |
| `choice` | Option names mapped to descriptions. | `choice` names the selected option; `probabilities` gives each option’s probability. |
| `noul` | Optional descriptions for `true` and `false`. | `noul` is the probability that the answer is true, from 0 to 1. |
| `score` | An array of level descriptions in ascending order. | `score` is the probability-weighted level, numbered from 0; `probabilities` and `legend` describe the levels. |

## Example

This request checks return eligibility, selects a department, and rates damage:

```
curl --fail-with-body -sS http://localhost:11434/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{
    &#34;model&#34;: &#34;nimble-v3&#34;,
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

For this example, look for a high `answers.eligible.noul`, `answers.department.choice` of `returns`, and an `answers.damage.score` near zero. Changing the purchase date from 12 to 90 days should reverse eligibility. Exact probabilities vary with the weight format and backend.

## Evaluation

### Bespoke Labs results

Bespoke Labs reports a **Decision Index 0.2.1 score of 56.88** for Nimble v3. The [published evaluation](https://huggingface.co/datasets/bespokelabs/bespoke-nimble-9b-v3-decision-index) includes the full run, inference implementation, and reproduction instructions. This is the publisher’s index score, measured with its reference implementation.

### On Ollama

The results below use the unmodified [JevBench](https://github.com/fstandhartinger/jevbench/tree/1bcc55e) original, easy, and hard sets: 231 cases with prompts spanning 190–4,112 tokens. Each variant completed all requests without API errors.

Measured on an Apple M5 Max with a 40-core GPU, using Ollama 0.40.4-rc0. Each variant had one warmup request followed by one complete serial run, on AC power with fans at maximum and no competing GPU workload. Median and p95 are full HTTP request times with the model already loaded.

| Variant | Correct / 231 | Median latency | p95 latency |
| --- | --- | --- | --- |
| MLX BF16 | 201 | 88 ms | 873 ms |
| MLX MXFP8 | 201 | 103 ms | 1,057 ms |
| MLX NVFP4 | 201 | 99 ms | 929 ms |
| GGUF BF16 | 202 | 176 ms | 1,336 ms |
| GGUF Q8_0 | 200 | 163 ms | 1,273 ms |
| GGUF Q4_K_M | 198 | 168 ms | 1,344 ms |

JevBench and Decision Index use different tasks and scoring; these results are separate evaluations. Latency depends on prompt length, question count, and hardware.

## Variants

`nimble-v3`, `nimble-v3:latest`, and `nimble-v3:9b` select **MXFP8 with MLX** on supported Apple Silicon systems, or **Q8_0 with llama.cpp**. To choose a specific format:

| Tag | Backend | Weight format | Download size |
| --- | --- | --- | --- |
| `nimble-v3:9b-mxfp8` | MLX | MXFP8 | 9.3 GB |
| `nimble-v3:9b-nvfp4` | MLX | NVFP4 with selected weights at MXFP8 | 6.9 GB |
| `nimble-v3:9b-mlx-bf16` | MLX | Unquantized BF16 | 17.9 GB |
| `nimble-v3:9b-q8_0` | llama.cpp | GGUF Q8_0 | 9.5 GB |
| `nimble-v3:9b-q4_K_M` | llama.cpp | GGUF Q4_K_M | 5.6 GB |
| `nimble-v3:9b-bf16` | llama.cpp | Unquantized GGUF BF16 | 17.9 GB |

Download sizes are approximate; runtime memory also includes caches and working buffers.

The Ollama packages merge Bespoke Labs’ adapter into the publisher-specified Qwen3.5-9B base and include the text weights. MLX quantized variants use NVIDIA Model Optimizer; GGUF quantized variants use llama.cpp.

## Notes

- Text input only. Use the decision API for structured answers; chat generation and image input are not supported.
- The full formatted request, including the state and questions, must fit within the context window.
- Probabilities are model estimates, not a guarantee of correctness. Validate decision thresholds on your own examples; quantization can change scores and decisions.
- Include an explicit fallback option when none of the other choices may apply.
