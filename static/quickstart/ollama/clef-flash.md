Clef Flash requires Ollama 0.35.1 or later.

Clef Flash is a 9B decision model from Cloudflare, fine-tuned from Qwen3.5-9B.

Clef Flash can also read images: add encoded images to the request and they’re scored jointly with the text state.

It’s fully compatible with the Jev and System One APIs, so it works through Ollama’s `/v1/systemone` endpoint. Use Clef Flash for latency-critical decisions; see [clef](https://ollama.com/library/clef) for the larger, more accurate variant.

```
ollama pull clef-flash
```

## Highlights

- Fast: Clef Flash had the lowest measured latency of any decision model in Cloudflare’s Decision Index runs — the 27B Clef is roughly five times slower.
- Multimodal: Decide over text, JSON, or images — screenshots, receipts, forms, photos.
- One forward pass: Every option of every question is scored jointly in a single non-autoregressive pass.
- 64K context window: Twice the state Jev’s 32K window holds.
- Apache 2.0 license

## What you can build

| Task | You define | You get back |
| --- | --- | --- |
| Route a request | The destinations and when each applies | The chosen destination and each destination’s probability |
| Check a condition | A yes or no question and the evidence | True or false, and the probability of each |
| Apply a policy | The rules and the allowed outcomes | A typed decision based on the text or images you supply |
| Gate an agent step | A condition and the agent’s proposed tool call | Go or no-go, with the probability of each |

## API

Decision models use Ollama’s `/v1/systemone` endpoint, [documented here](https://docs.ollama.com/capabilities/decision). Put the text you want judged in `state` and your questions in `questions`. Ollama builds Clef Flash’s prompt for you.

| Field | Description |
| --- | --- |
| `model` | `clef-flash` |
| `state` | The text to judge. Use a string, or a JSON object or array for structured input. |
| `images` | Optional. Base64-encoded PNG, JPEG, or WebP images shared by all questions, in request order. URLs and data URLs are not supported. |
| `questions` | 1 to 64 named questions. Answers come back in the same order. |
| `keep_alive` | Optional. How long the model stays loaded after the request. |

Every question has a `type`, `instructions`, and usually `criteria`:

| Type | `criteria` | Answer fields |
| --- | --- | --- |
| `choice` | An object mapping each option to a description. Use `null` to let the option name describe itself. 2 to 26 options. | `choice`, `probabilities`, `confidence` |
| `noul` | Optional. `{&#34;true&#34;: &#34;...&#34;, &#34;false&#34;: &#34;...&#34;}` if you want to describe each side. | `noul`, the probability that the answer is true |
| `score` | An array of level descriptions, lowest first. Levels are numbered from 0. 2 to 26 levels. | `score` (the probability-weighted level), `legend`, `probabilities`, `confidence` |

`confidence` runs from 0 to 1 and shows how concentrated the probabilities are. It isn’t the chance that the answer is right. If two options tie, the answer follows the model’s option order, so put your preferred option first.

### cURL

```
curl http://localhost:11434/v1/systemone -d '{
  &#34;model&#34;: &#34;clef-flash&#34;,
  &#34;state&#34;: &#34;Checkout has been failing for every customer for the last hour.&#34;,
  &#34;questions&#34;: {
    &#34;urgent&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;instructions&#34;: &#34;Is this support request urgent?&#34;},
    &#34;team&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;instructions&#34;: &#34;Which team should handle this request?&#34;,
      &#34;criteria&#34;: {
        &#34;billing&#34;: &#34;Payments, invoices, and refunds&#34;,
        &#34;technical&#34;: &#34;Outages, errors, and configuration&#34;,
        &#34;sales&#34;: &#34;Plans and upgrades&#34;
      }
    },
    &#34;severity&#34;: {
      &#34;type&#34;: &#34;score&#34;,
      &#34;instructions&#34;: &#34;How severe is the customer impact?&#34;,
      &#34;criteria&#34;: [&#34;No impact&#34;, &#34;Minor&#34;, &#34;Major&#34;, &#34;Critical&#34;]
    }
  }
}'
```

```
{
  &#34;model&#34;: &#34;clef-flash&#34;,
  &#34;answers&#34;: {
    &#34;urgent&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;noul&#34;: 0.998},
    &#34;team&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;choice&#34;: &#34;technical&#34;,
      &#34;probabilities&#34;: {&#34;billing&#34;: 0.004, &#34;technical&#34;: 0.992, &#34;sales&#34;: 0.004},
      &#34;confidence&#34;: 0.947
    },
    &#34;severity&#34;: {
      &#34;type&#34;: &#34;score&#34;,
      &#34;score&#34;: 2.851,
      &#34;legend&#34;: {&#34;0&#34;: &#34;No impact&#34;, &#34;1&#34;: &#34;Minor&#34;, &#34;2&#34;: &#34;Major&#34;, &#34;3&#34;: &#34;Critical&#34;},
      &#34;probabilities&#34;: {&#34;0&#34;: 0.002, &#34;1&#34;: 0.014, &#34;2&#34;: 0.271, &#34;3&#34;: 0.713},
      &#34;confidence&#34;: 0.631
    }
  },
  &#34;usage&#34;: {&#34;input_tokens&#34;: 486, &#34;output_tokens&#34;: 3}
}
```

### Python

Use TypeSafe’s official Python SDK and point it at Ollama. The SDK requires an API key, but Ollama ignores it, so any value works.

```
pip install typesafe-sdk
export TYPESAFE_BASE_URL=http://localhost:11434
export TYPESAFE_API_KEY=ollama
export TYPESAFE_DEFAULT_MODEL=clef-flash
```

```
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

questions = {
    &#34;urgent&#34;: Noul(instructions=&#34;Is this support request urgent?&#34;),
    &#34;team&#34;: Choice(
        instructions=&#34;Which team should handle this request?&#34;,
        criteria={&#34;billing&#34;: &#34;Payments, invoices, and refunds&#34;, &#34;technical&#34;: &#34;Outages, errors, and configuration&#34;, &#34;sales&#34;: &#34;Plans and upgrades&#34;},
    ),
    &#34;severity&#34;: Score(instructions=&#34;How severe is the customer impact?&#34;, criteria=[&#34;No impact&#34;, &#34;Minor&#34;, &#34;Major&#34;, &#34;Critical&#34;]),
}

with TypeSafeClient(timeout=120) as client:
    result = client.system_one(state=&#34;Checkout has been failing for every customer for the last hour.&#34;, questions=questions)

print(result.nouls[&#34;urgent&#34;].noul)     # 0.998
print(result.choices[&#34;team&#34;].choice)   # technical
print(result.scores[&#34;severity&#34;].score) # 2.85
```

Decision models aren’t in the Ollama CLI or the Ollama Python and JavaScript libraries yet. Use the API or the TypeSafe SDK for now.

### More examples

Images. Gate agent actions on what’s in the frame.

```
curl http://localhost:11434/v1/systemone -d '{
  &#34;model&#34;: &#34;clef-flash&#34;,
  &#34;state&#34;: &#34;The agent wants to submit the attached form.&#34;,
  &#34;images&#34;: [&#34;<base64-encoded image>&#34;],
  &#34;questions&#34;: {
    &#34;complete&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;instructions&#34;: &#34;Are all required fields filled in?&#34;},
    &#34;type&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;instructions&#34;: &#34;What kind of document is this?&#34;,
      &#34;criteria&#34;: {&#34;invoice&#34;: null, &#34;receipt&#34;: null, &#34;contract&#34;: null, &#34;other&#34;: null}
    }
  }
}'
```

Model routing. Send each prompt to the model that fits it.

```
curl http://localhost:11434/v1/systemone -d '{
  &#34;model&#34;: &#34;clef-flash&#34;,
  &#34;state&#34;: &#34;Design a sharded database schema for a payments ledger.&#34;,
  &#34;questions&#34;: {
    &#34;model&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;instructions&#34;: &#34;Which model should answer this prompt?&#34;,
      &#34;criteria&#34;: {&#34;gemma4&#34;: &#34;Small model&#34;, &#34;gpt-6&#34;: &#34;Large model&#34;}
    }
  }
}'
```

### Benchmarks

| Benchmark | Clef-flash | Clef | Jev |
| --- | --- | --- | --- |
| BFCL (case exact accuracy) | 98.8 | 98.5 | 95.8 |
| API-Bank (accuracy) | 93.1 | 91.9 | 88.2 |
| BANKING77 (macro-F1) | 90.9 | 94.2 | 79.7 |
| CLINC150+OOS (macro-F1) | 66.8 | 97.4 | 89.3 |
| Home appliance simulator (case exact accuracy) | 97.7 | 83.0 | 52.3 |
| ANLI (macro-F1) | 59.1 | 69.8 | 74.8 |
| RouterBench (selected quality) | 79.9 | 79.7 | 79.9 |
| When2Call (accuracy) | 65.6 | 72.4 | 81.0 |
| Median latency (ms) | 38.8 | 209.3 | 524.1 |
| p95 latency (ms) | 122.4 | 238.6 | 536.0 |

Decision accuracy on four end-to-end business workflows from Typesafe Evals:

| Workflow | Clef-flash | Clef | Jev |
| --- | --- | --- | --- |
| Invoice processing | 57.1 | 64.7 | 61.8 |
| Customer service | 77.0 | 76.3 | 76.0 |
| Security incidents | 61.7 | 62.9 | 61.7 |
| Agent trace observability | 69.8 | 68.5 | 71.6 |
