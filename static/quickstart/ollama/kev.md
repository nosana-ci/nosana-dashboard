# Kev

Kev is a family of text decision models from [Jared Palmer](https://huggingface.co/jaredpalmer). It reads a state and one or more typed questions, then scores the supplied answers in a forward pass. Use Ollama’s local `/v1/systemone` API for classification, yes/no decisions, and ordered scores. Kev does not generate text or accept images.

**Requires Ollama 0.40.4 or later.** These tags use the Apple Silicon MLX runner and advertise the `decision` capability.

## Choose a model

`kev` and `kev:latest` select **`kev:9b-nvfp4`**. It is the default balance of quality, response time, and memory on the tested M5 Max. The 27B variants are the quality choices; the 0.8B variants fit tighter memory budgets. All four publisher size checkpoints are available as BF16 tags. Lower-memory formats are additional choices, not replacements for those checkpoints.

| Tag | Format | Public JevBench correct | Hard subset correct | M5 Max resident memory¹ |
| --- | --- | --- | --- | --- |
| `kev:0.8b-mlx-bf16` | BF16 | 146⁄231 | 39⁄111 | 3.28 GiB |
| `kev:0.8b-mxfp8` | MXFP8 | 146⁄231 | 39⁄111 | 2.84 GiB |
| `kev:4b-mlx-bf16` | BF16 | 175⁄231 | 60⁄111 | 12.47 GiB |
| `kev:9b-mlx-bf16` | BF16 | 184⁄231 | 66⁄111 | 19.59 GiB |
| **`kev:9b-nvfp4`** | mixed NVFP4/MXFP8 | **183⁄231** | **68⁄111** | **11.16 GiB** |
| `kev:27b-mlx-bf16` | BF16 | 202⁄231 | 83⁄111 | 55.56 GiB |
| `kev:27b-nvfp4` | mixed NVFP4/MXFP8 | 205⁄231 | 86⁄111 | 25.56 GiB |

¹ `/api/ps` resident size after a three-question workload on one Apple M5 Max with 128 GB unified memory. It is not a peak-memory requirement. All seven JevBench rows are final-runtime local results from the same 231 public tasks in JevBench v1.2.16. Each tag returned 231 valid responses. The results do not include the 303 unavailable sealed or judge tasks and are not an official leaderboard score. Quantization changed some individual answers and probabilities even where aggregate accuracy was close.

The 9B NVFP4 default answered 68⁄111 hard public tasks while using less observed resident memory than 4B BF16 (60⁄111, 12.47 GiB) or 9B BF16 (66⁄111, 19.59 GiB). The 27B NVFP4 tag answered 86⁄111 hard tasks and used 25.56 GiB resident, so it is the stronger choice when the extra memory and response time are acceptable. These are results from one public set, not guarantees for a different task. The default follows the [Tev1](https://ollama.com/library/tev1/tags), [Nimble](https://ollama.com/library/nimble/tags), and [Clef Flash](https://ollama.com/library/clef-flash/tags) pattern of selecting a capable compact variant while retaining explicit larger or source-precision tags.

## Try it

Pull a tag, then send a System One request to the local server:

```
ollama pull kev

curl http://localhost:11434/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{
    &#34;model&#34;: &#34;kev&#34;,
    &#34;state&#34;: &#34;The package arrived with a cracked screen.&#34;,
    &#34;questions&#34;: {
      &#34;route&#34;: {
        &#34;type&#34;: &#34;choice&#34;,
        &#34;instructions&#34;: &#34;Which team should handle this message?&#34;,
        &#34;criteria&#34;: {
          &#34;returns&#34;: &#34;Damaged items and returns&#34;,
          &#34;shipping&#34;: &#34;Delivery and tracking&#34;,
          &#34;billing&#34;: &#34;Payments and charges&#34;
        }
      }
    }
  }'
```

The `route` answer contains a `choice`, probabilities for each option, and a confidence value. Kev also supports `noul` questions (probability of true) and `score` questions (an expected level over ordered criteria). See the [System One guide](https://docs.ollama.com/capabilities/decision) for response shapes and more examples.

For Kev, `choice` accepts 1–255 named options and `score` accepts 1–255 ordered levels. Descriptions may be JSON values. Multiple questions can share a state in one request. Reported probabilities and confidence are rounded to four decimal places; confidence describes how concentrated the choices are, not the chance that the answer is correct. The tag’s `num_ctx` is 73,728 tokens, but a large accepted input does not imply reliable accuracy at that length.

## Use and limitations

These models are designed for bounded decisions where the relevant evidence and permitted answers are supplied. Add an explicit `none` option when no listed answer may fit. Check output quality and probability thresholds on labeled examples from your own task, especially after changing model size or quantization. The 0.8B models are best suited to simpler decisions; in the local public JevBench run they got only 39⁄111 hard tasks correct.

The publisher’s evaluations focus on English. Accuracy can fall on unfamiliar domains, long inputs, reordered options, and tasks that need facts absent from the state. A fitted temperature does not make probabilities universally calibrated. Do not use these models as the sole control for consequential decisions. [Kev 4B](https://huggingface.co/jaredpalmer/kev-4b/blob/6cfce5c2fa4b4bd64026336ab649c5ca78857d52/README.md) and [Kev 27B](https://huggingface.co/jaredpalmer/kev-27b/blob/af0e6d551bdc2cc724f3e9d7a8bee1cd4fb8f7bf/README.md) document the publisher’s separate held-out and long-document evaluations and their limits.

## Source and license

The source checkpoints are [0.8B](https://huggingface.co/jaredpalmer/kev-0.8b/tree/bf75a6a8848ea6960ff2ed108d9ed44c2941174f), [4B](https://huggingface.co/jaredpalmer/kev-4b/tree/6cfce5c2fa4b4bd64026336ab649c5ca78857d52), [9B](https://huggingface.co/jaredpalmer/kev-9b/tree/db029f08b290afd9fee4aa4bbcd9ae48602d1eb0), and [27B](https://huggingface.co/jaredpalmer/kev-27b/tree/af0e6d551bdc2cc724f3e9d7a8bee1cd4fb8f7bf). The 0.8B, 4B, and 9B Ollama weights merge the publisher’s adapters with their identified Qwen3.5 bases; 27B uses the publisher’s full text checkpoint and its selected Qwen3.8 tokenizer. The pointer head remains FP32 in every format. The publisher and base-model licenses are Apache-2.0; the applicable license texts are included in each tag.
