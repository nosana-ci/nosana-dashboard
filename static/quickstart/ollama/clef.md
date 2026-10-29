Clef requires Ollama 0.35.1 or later. To use Clef in Ollama’s cloud, use Ollama 0.40.6 or later.

Clef is a 27B decision model from Cloudflare, fine-tuned from Qwen3.8-27B.

Clef reads text, JSON, and images. Images are scored together with the text.

Clef uses the System One API through Ollama’s `/v1/systemone` endpoint. You can call it from the Ollama CLI, the Ollama Python and JavaScript libraries, or TypeSafe’s Python SDK. See [clef-flash](https://ollama.com/library/clef-flash) for a smaller, faster variant.

```
ollama pull clef
```

Or run it in Ollama’s cloud with a paid plan or [usage credits](https://ollama.com/pricing). No download needed:

```
ollama run clef:cloud --ask &#34;Is a refund being requested?&#34; < ticket.txt
```

## Highlights

- Multimodal: Decide over text, JSON, or images, such as screenshots, receipts, forms, and photos.
- One forward pass: Every option of every question is scored jointly in a single non-autoregressive pass.
- 64K context window: Twice the state Jev’s 32K window holds.
- Leading accuracy: Clef tops the Decision Index, Cloudflare’s leaderboard of decision models, and beats Jev on most of its suite.
- Apache 2.0 license

## What you can build

| Task | You define | You get back |
| --- | --- | --- |
| Route a request | The destinations and when each applies | The chosen destination and each destination’s probability |
| Check a condition | A yes-or-no question and the evidence | The probability that the answer is yes |
| Apply a policy | The rules and the allowed outcomes | A typed decision based on the text or images you supply |
| Read a document | A photo of the page and the fields to decide | A field-by-field decision with probabilities |
| Moderate a tool call | The call an agent is about to make | The probability that it’s harmful, before it runs |

## CLI

Ask questions about text you pipe in, or pass after the model name. Each `--ask` is a yes-or-no question unless you follow it with labels to choose from (`--choice`) or levels to score it on (`--level`, lowest first).

```
# Yes or no
ollama run clef:cloud --ask &#34;Is a refund being requested?&#34; < ticket.txt
```

```
yes  99%
```

```
# Choose a label and score urgency in one request
ollama run clef:cloud --ask &#34;Which team should handle this?&#34; \
  --choice billing=&#34;Payments and refunds&#34; \
  --choice technical=&#34;Software problems&#34; \
  --choice other=&#34;Anything else&#34; \
  --ask &#34;How urgent is this?&#34; \
  --level Routine --level Soon --level Immediate < ticket.txt
```

```
Which team should handle this?  billing    99%
How urgent is this?             Immediate  97%  2.0 / 2
```

```
# Judge an image: put its path in the text
ollama run clef:cloud &#34;An employee submitted ./receipt.png for reimbursement.&#34; \
  --ask &#34;Is this a restaurant receipt?&#34; \
  --ask &#34;What kind of purchase is this?&#34; \
  --choice meals --choice travel --choice office --choice other \
  --ask &#34;Does the receipt include alcohol?&#34;
```

```
Is this a restaurant receipt?      yes    97%
What kind of purchase is this?     meals  94%
Does the receipt include alcohol?  yes    94%
```

```
# Check an agent's tool call before it runs
echo 'send_email(to=&#34;all-customers&#34;, subject=&#34;FINAL NOTICE: account will be suspended today&#34;)' \
  | ollama run clef:cloud --ask &#34;Could this tool call cause harm?&#34;
```

```
yes  93%
```

Drop `:cloud` to run the same commands on the local model. Add `--format json` to print the full API response.

## API

Put the text you want judged in `state` and your questions in `questions`. Ollama builds Clef’s prompt for you. See the [decision guide](https://docs.ollama.com/capabilities/decision) for the full reference.

| Field | Description |
| --- | --- |
| `model` | `clef` locally, or `clef:cloud` through a local Ollama signed in to ollama.com. Use `clef` when calling ollama.com directly. |
| `state` | The text to judge. Use a string, or a JSON object or array for structured input. |
| `images` | Optional. Base64-encoded PNG, JPEG, or WebP images shared by all questions, in request order. |
| `questions` | 1 to 64 named questions. Answers come back in the same order. |
| `keep_alive` | Optional, local only. How long the model stays loaded after the request. |

Every question has a `type`, `instructions`, and usually `criteria`:

| Type | `criteria` | Answer fields |
| --- | --- | --- |
| `choice` | An object mapping each option to a description. Use `null` to let the option name describe itself. 2 to 26 options locally, up to 255 in the cloud. | `choice`, `probabilities`, `confidence` |
| `noul` | Optional. `{&#34;true&#34;: &#34;...&#34;, &#34;false&#34;: &#34;...&#34;}` if you want to describe each side. | `noul`, the probability that the answer is true |
| `score` | An array of 2 to 10 level descriptions, lowest first. Levels are numbered from 0. | `score` (the probability-weighted level), `legend`, `probabilities`, `confidence` |

`confidence` runs from 0 to 1 and shows how concentrated the probabilities are. It isn’t the chance that the answer is right. If two options tie, the answer follows the model’s option order, so put your preferred option first.

### cURL

```
curl http://localhost:11434/v1/systemone -d '{
  &#34;model&#34;: &#34;clef:cloud&#34;,
  &#34;state&#34;: {&#34;ticket&#34;: &#34;I was charged twice. Please refund the extra payment.&#34;},
  &#34;questions&#34;: {
    &#34;team&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;instructions&#34;: &#34;Which team should handle this ticket?&#34;,
      &#34;criteria&#34;: {
        &#34;billing&#34;: &#34;Payments and refunds&#34;,
        &#34;technical&#34;: &#34;Bugs and integrations&#34;,
        &#34;other&#34;: &#34;None of the above&#34;
      }
    },
    &#34;refund&#34;: {
      &#34;type&#34;: &#34;noul&#34;,
      &#34;instructions&#34;: &#34;Does the customer explicitly ask for a refund?&#34;
    },
    &#34;urgency&#34;: {
      &#34;type&#34;: &#34;score&#34;,
      &#34;instructions&#34;: &#34;How urgent is this ticket?&#34;,
      &#34;criteria&#34;: [&#34;Routine&#34;, &#34;Soon&#34;, &#34;Urgent&#34;]
    }
  }
}'
```

```
{
  &#34;model&#34;: &#34;clef&#34;,
  &#34;answers&#34;: {
    &#34;team&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;choice&#34;: &#34;billing&#34;,
      &#34;probabilities&#34;: {&#34;billing&#34;: 0.9888, &#34;technical&#34;: 0.0044, &#34;other&#34;: 0.0068},
      &#34;confidence&#34;: 0.9667
    },
    &#34;refund&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;noul&#34;: 0.9916},
    &#34;urgency&#34;: {
      &#34;type&#34;: &#34;score&#34;,
      &#34;score&#34;: 1.5481,
      &#34;legend&#34;: {&#34;0&#34;: &#34;Routine&#34;, &#34;1&#34;: &#34;Soon&#34;, &#34;2&#34;: &#34;Urgent&#34;},
      &#34;probabilities&#34;: {&#34;0&#34;: 0.0871, &#34;1&#34;: 0.2778, &#34;2&#34;: 0.6351},
      &#34;confidence&#34;: 0.2322
    }
  },
  &#34;usage&#34;: {&#34;input_tokens&#34;: 332, &#34;output_tokens&#34;: 0}
}
```

### Python

Use the [Ollama Python library](https://github.com/ollama/ollama-python), version 0.6.3 or later:

```
pip install -U ollama
```

```
import ollama

response = ollama.systemone(
    model=&#34;clef:cloud&#34;,
    state={&#34;ticket&#34;: &#34;I was charged twice. Please refund the extra payment.&#34;},
    questions={
        &#34;team&#34;: {
            &#34;type&#34;: &#34;choice&#34;,
            &#34;instructions&#34;: &#34;Which team should handle this ticket?&#34;,
            &#34;criteria&#34;: {&#34;billing&#34;: &#34;Payments and refunds&#34;, &#34;technical&#34;: &#34;Bugs and integrations&#34;, &#34;other&#34;: &#34;None of the above&#34;},
        },
        &#34;refund&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;instructions&#34;: &#34;Does the customer explicitly ask for a refund?&#34;},
        &#34;urgency&#34;: {&#34;type&#34;: &#34;score&#34;, &#34;instructions&#34;: &#34;How urgent is this ticket?&#34;, &#34;criteria&#34;: [&#34;Routine&#34;, &#34;Soon&#34;, &#34;Urgent&#34;]},
    },
)

print(response.answers[&#34;team&#34;].choice)    # billing
print(response.answers[&#34;refund&#34;].noul)    # 0.9916
print(response.answers[&#34;urgency&#34;].score)  # 1.5481
```

To call ollama.com directly, create an [API key](https://ollama.com/settings/keys) and point a client at it:

```
import os
from ollama import Client

client = Client(host=&#34;https://ollama.com&#34;, headers={&#34;Authorization&#34;: &#34;Bearer &#34; + os.environ[&#34;OLLAMA_API_KEY&#34;]})

response = client.systemone(
    model=&#34;clef&#34;,
    state='send_email(to=&#34;all-customers&#34;, subject=&#34;FINAL NOTICE: account will be suspended today&#34;)',
    questions={&#34;harm&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;instructions&#34;: &#34;Could this tool call cause harm?&#34;}},
)
print(response.answers[&#34;harm&#34;].noul)
```

### TypeSafe SDK

TypeSafe’s Python SDK also works with Ollama, for text and JSON state. It requires an API key: locally Ollama ignores it, so any value works.

```
pip install typesafe-sdk
export TYPESAFE_BASE_URL=http://localhost:11434
export TYPESAFE_API_KEY=ollama
export TYPESAFE_DEFAULT_MODEL=clef:cloud
```

```
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

questions = {
    &#34;team&#34;: Choice(
        instructions=&#34;Which team should handle this ticket?&#34;,
        criteria={&#34;billing&#34;: &#34;Payments and refunds&#34;, &#34;technical&#34;: &#34;Bugs and integrations&#34;, &#34;other&#34;: &#34;None of the above&#34;},
    ),
    &#34;refund&#34;: Noul(instructions=&#34;Does the customer explicitly ask for a refund?&#34;),
    &#34;urgency&#34;: Score(instructions=&#34;How urgent is this ticket?&#34;, criteria=[&#34;Routine&#34;, &#34;Soon&#34;, &#34;Urgent&#34;]),
}

with TypeSafeClient(timeout=120) as client:
    result = client.system_one(state={&#34;ticket&#34;: &#34;I was charged twice. Please refund the extra payment.&#34;}, questions=questions)

print(result.choices[&#34;team&#34;].choice)   # billing
print(result.nouls[&#34;refund&#34;].noul)     # 0.9916
print(result.scores[&#34;urgency&#34;].score)  # 1.5481
```

To send images, use the API or the Ollama CLI. The SDK uploads images in a format Ollama doesn’t accept.

### Images

Send screenshots, receipts, or photos alongside any text state.

```
curl http://localhost:11434/v1/systemone -d '{
  &#34;model&#34;: &#34;clef:cloud&#34;,
  &#34;state&#34;: &#34;An employee submitted this receipt for reimbursement.&#34;,
  &#34;images&#34;: [&#34;<base64-encoded image>&#34;],
  &#34;questions&#34;: {
    &#34;total&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;instructions&#34;: &#34;Is the receipt total legible?&#34;},
    &#34;category&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;instructions&#34;: &#34;What kind of purchase is this?&#34;,
      &#34;criteria&#34;: {&#34;meals&#34;: null, &#34;travel&#34;: null, &#34;office&#34;: null, &#34;other&#34;: null}
    },
    &#34;alcohol&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;instructions&#34;: &#34;Does the receipt include alcohol?&#34;}
  }
}'
```

```
{
  &#34;model&#34;: &#34;clef&#34;,
  &#34;answers&#34;: {
    &#34;total&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;noul&#34;: 0.9837},
    &#34;category&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;choice&#34;: &#34;meals&#34;,
      &#34;probabilities&#34;: {&#34;meals&#34;: 0.8425, &#34;travel&#34;: 0.1046, &#34;office&#34;: 0.016, &#34;other&#34;: 0.0369},
      &#34;confidence&#34;: 0.6298
    },
    &#34;alcohol&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;noul&#34;: 0.9647}
  },
  &#34;usage&#34;: {&#34;input_tokens&#34;: 811, &#34;output_tokens&#34;: 0}
}
```

### Cloud limits

In the cloud, question names may only use letters, digits, `_`, `.`, and `-`, up to 100 characters. A request can include up to 4 images, each at most 4 MiB and 16 megapixels, 8 MiB in total. Input is limited to 65,536 tokens. Longer input is rejected, not truncated. Usage is billed per input token at the [listed price](https://ollama.com/pricing).

## Benchmarks

| Benchmark | Clef | Clef-flash | Jev |
| --- | --- | --- | --- |
| BFCL (case exact accuracy) | 98.5 | 98.8 | 95.8 |
| API-Bank (accuracy) | 91.9 | 93.1 | 88.2 |
| BANKING77 (macro-F1) | 94.2 | 90.9 | 79.7 |
| CLINC150+OOS (macro-F1) | 97.4 | 66.8 | 89.3 |
| Home appliance simulator (case exact accuracy) | 83.0 | 97.7 | 52.3 |
| ANLI (macro-F1) | 69.8 | 59.1 | 74.8 |
| RouterBench (selected quality) | 79.7 | 79.9 | 79.9 |
| PhishNChips (accuracy) | 79.6 | 75.0 | 62.5 |
| Median latency (ms) | 209.3 | 38.8 | 524.1 |
| p95 latency (ms) | 238.6 | 122.4 | 536.0 |

Decision accuracy on four end-to-end business workflows from Typesafe Evals:

| Workflow | Clef | Clef-flash | Jev |
| --- | --- | --- | --- |
| Invoice processing | 64.7 | 57.1 | 61.8 |
| Customer service | 76.3 | 77.0 | 76.0 |
| Security incidents | 62.9 | 61.7 | 61.7 |
| Agent trace observability | 68.5 | 69.8 | 71.6 |
