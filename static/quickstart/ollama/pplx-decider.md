pplx-decider is a 27B decision model from Perplexity, fine-tuned from Qwen3.8-27B. Give it a state (text, JSON, or images) and a set of typed questions, and it returns a calibrated probability for every answer in a single forward pass. It doesn’t generate text.

It’s compatible with the Jev and System One APIs, so it works through Ollama’s `/v1/systemone` endpoint and `ollama run --ask`.

```
ollama pull pplx-decider
```

## Highlights

- **Accurate**: 85.7% across 11 public benchmarks in Perplexity’s evaluation, ahead of Jev (84.5%) and its Qwen3.8-27B base (74.8%).
- **Multimodal**: decide over text, JSON, or images such as screenshots, receipts, and forms.
- **One forward pass**: every option of every question is scored together, with no output tokens.
- **Apache 2.0 license**

## What you can build

| Task | You define | You get back |
| --- | --- | --- |
| Route a request | The destinations and when each applies | The chosen destination and each destination’s probability |
| Check a condition | A yes or no question | True or false, and the probability of each |
| Grade an answer | A rubric of levels | The probability-weighted level and each level’s probability |
| Gate an agent step | A condition and the agent’s proposed action | Go or no-go, with the probability of each |

## CLI

```
ollama run pplx-decider --ask &#34;Is a refund being requested?&#34; < ticket.txt
```

```
ollama run pplx-decider --ask &#34;Which team should handle this?&#34; \
  --choice billing=&#34;Payments and refunds&#34; \
  --choice technical=&#34;Outages and errors&#34; < ticket.txt
```

```
ollama run pplx-decider --ask &#34;How urgent is this?&#34; \
  --level &#34;Routine&#34; \
  --level &#34;Soon&#34; \
  --level &#34;Immediate&#34; < ticket.txt
```

The state can also follow the model name instead of coming from stdin.

## API

Decision models use Ollama’s `/v1/systemone` endpoint, [documented here](https://docs.ollama.com/capabilities/decision). Put the text you want judged in `state` and your questions in `questions`. Ollama builds pplx-decider’s prompt for you.

| Field | Description |
| --- | --- |
| `model` | `pplx-decider` |
| `state` | The text to judge. Use a string, or a JSON object or array for structured input. |
| `images` | Optional. Base64-encoded PNG, JPEG, or WebP images shared by all questions, in request order. |
| `questions` | 1 to 64 named questions. Answers come back in the same order. |
| `keep_alive` | Optional. How long the model stays loaded after the request. |

Every question has a `type`, `instructions`, and usually `criteria`:

| Type | `criteria` | Answer fields |
| --- | --- | --- |
| `choice` | An object mapping each option to a description. Use `null` to let the option name describe itself. | `choice`, `probabilities`, `confidence` |
| `noul` | Optional. `{&#34;true&#34;: &#34;...&#34;, &#34;false&#34;: &#34;...&#34;}` to describe each side. | `noul`, the probability that the answer is true |
| `score` | An array of 2 to 10 level descriptions, lowest first. Levels are numbered from 0. | `score` (the probability-weighted level), `legend`, `probabilities`, `confidence` |

`confidence` runs from 0 to 1 and shows how strongly the probabilities favor one answer. It isn’t the chance that the answer is right.

### cURL

```
curl http://localhost:11434/v1/systemone -d '{
  &#34;model&#34;: &#34;pplx-decider&#34;,
  &#34;state&#34;: &#34;Our app crashes on launch for every user since this morning'\''s update. Please fix it now.&#34;,
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

Response:

```
{
  &#34;model&#34;: &#34;pplx-decider&#34;,
  &#34;answers&#34;: {
    &#34;urgent&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;noul&#34;: 0.994},
    &#34;team&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;choice&#34;: &#34;technical&#34;,
      &#34;probabilities&#34;: {&#34;billing&#34;: 0.002, &#34;technical&#34;: 0.996, &#34;sales&#34;: 0.002},
      &#34;confidence&#34;: 0.994
    },
    &#34;severity&#34;: {
      &#34;type&#34;: &#34;score&#34;,
      &#34;score&#34;: 2.975,
      &#34;legend&#34;: {&#34;0&#34;: &#34;No impact&#34;, &#34;1&#34;: &#34;Minor&#34;, &#34;2&#34;: &#34;Major&#34;, &#34;3&#34;: &#34;Critical&#34;},
      &#34;probabilities&#34;: {&#34;0&#34;: 0.001, &#34;1&#34;: 0.002, &#34;2&#34;: 0.017, &#34;3&#34;: 0.98},
      &#34;confidence&#34;: 0.975
    }
  },
  &#34;usage&#34;: {&#34;input_tokens&#34;: 338, &#34;output_tokens&#34;: 0}
}
```

### Python

Use TypeSafe’s official Python SDK and point it at Ollama. The SDK requires an API key, but Ollama ignores it, so any value works.

```
pip install typesafe-sdk
export TYPESAFE_BASE_URL=http://localhost:11434
export TYPESAFE_API_KEY=ollama
export TYPESAFE_DEFAULT_MODEL=pplx-decider
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
    result = client.system_one(state=&#34;Our app crashes on launch for every user since this morning's update. Please fix it now.&#34;, questions=questions)

print(result.choices[&#34;team&#34;].choice)  # technical
```

### Images

```
curl http://localhost:11434/v1/systemone -d '{
  &#34;model&#34;: &#34;pplx-decider&#34;,
  &#34;state&#34;: &#34;The agent wants to submit the attached form.&#34;,
  &#34;images&#34;: [&#34;<base64-encoded image>&#34;],
  &#34;questions&#34;: {
    &#34;complete&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;instructions&#34;: &#34;Are all required fields filled in?&#34;},
    &#34;kind&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;instructions&#34;: &#34;What kind of document is this?&#34;,
      &#34;criteria&#34;: {&#34;invoice&#34;: null, &#34;receipt&#34;: null, &#34;contract&#34;: null, &#34;other&#34;: null}
    }
  }
}'
```

## Benchmarks

Accuracy reported by Perplexity, measured through the Perplexity API. See the [model card](https://huggingface.co/perplexity-ai/pplx-decider-v1-27b) for all 11 benchmarks.

| Benchmark | pplx-decider | Jev | Qwen3.8-27B |
| --- | --- | --- | --- |
| RAGTruth | **88.8%** | 77.3% | 61.5% |
| FinancialPhraseBank | **84.2%** | 77.0% | 75.7% |
| TabFact | **90.6%** | 89.8% | 78.6% |
| JudgeBench | 78.3% | **78.6%** | 68.9% |
| WinoGrande | 83.3% | **90.7%** | 73.1% |
| **Overall (11 benchmarks)** | **85.7%** | 84.5% | 74.8% |

## License

[Apache 2.0](https://huggingface.co/perplexity-ai/pplx-decider-v1-27b/blob/main/LICENSE)
