Laya requires Ollama 0.40.0 or later.

Laya is a 421M decision model from Convai Innovations, fine-tuned from ModernBERT-large.

It scores every option of every question in a single forward pass and returns typed answers with calibrated probabilities. There is no language-model decoder and no text generation — nothing to parse, nothing to hallucinate.

The shipped checkpoint is fine-tuned on real, human-annotated workflows: email triage (spam, phishing, and department routing), content safety, intent routing, and fact verification.

```
ollama pull laya
```

## Highlights

- Small and fast: 421M parameters. Can answer one question in under 10 ms on M5 Max.
- Calibrated probabilities: trained with RLCD against strictly proper scoring rules, so the only way to maximize reward is to report honest probabilities. In-task calibration error (ECE) is 0.060.
- Three question types: Pick from a list, answer true or false, or place something on a rubric.
- Many questions per request: Ask up to 64 questions about the same text in one call. They share a single forward pass.
- Apache 2.0 license

## What you can build

| Task | You define | You get back |
| --- | --- | --- |
| Route a request | The departments and when each applies | The chosen department and each department’s probability |
| Screen an email | Flags for spam, phishing, or escalation | A probability for each flag |
| Rate urgency | Ordered levels, each with clear criteria | The expected level and the probability of each level |
| Apply a policy | The rules and the allowed outcomes | A typed decision based on the text you supply |

## API

Decision models use Ollama’s `/v1/systemone` endpoint, which follows TypeSafe’s Jev API. Put the text you want judged in `state` and your questions in `questions`. Ollama builds Laya’s prompt for you.

| Field | Description |
| --- | --- |
| `model` | `laya` |
| `state` | The text to judge. Use a string, or a JSON object or array for structured input. |
| `questions` | 1 to 64 named questions. Answers come back in the same order. |
| `keep_alive` | Optional. How long the model stays loaded after the request. |

Every question has a `type`, `instructions`, and usually `criteria`:

| Type | `criteria` | Answer fields |
| --- | --- | --- |
| `choice` | An object mapping each option to a description. Use `null` to let the option name describe itself. | `choice`, `probabilities`, `confidence` |
| `noul` | Optional. `{&#34;true&#34;: &#34;...&#34;, &#34;false&#34;: &#34;...&#34;}` if you want to describe each side. | `noul`, the probability that the answer is true |
| `score` | An array of level descriptions, lowest first. Levels are numbered from 0. | `score` (the probability-weighted level), `legend`, `probabilities`, `confidence` |

Choice and score questions take 2 to 26 options. Every option shares a fixed token budget inside Laya’s decision head, so large label sets narrow what each option looks like to the model; keep a single choice question to roughly 20 options. `confidence` runs from 0 to 1 and shows how concentrated the probabilities are. It isn’t the chance that the answer is right.

### cURL

```
curl http://localhost:11434/v1/systemone -d '{
  &#34;model&#34;: &#34;laya&#34;,
  &#34;state&#34;: {
    &#34;from&#34;: &#34;customer@acme.com&#34;,
    &#34;subject&#34;: &#34;Duplicate billing on March invoice #4411&#34;,
    &#34;body&#34;: &#34;Hi team, we were billed twice for March. Please refund the duplicate before Friday or we will cancel our plan.&#34;
  },
  &#34;questions&#34;: {
    &#34;department&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;instructions&#34;: &#34;Which department should handle this email?&#34;,
      &#34;criteria&#34;: {
        &#34;billing&#34;: &#34;Invoices, payments, refunds&#34;,
        &#34;technical&#34;: &#34;Bugs, outages, integrations&#34;,
        &#34;sales&#34;: &#34;Pricing, contracts, demos&#34;,
        &#34;other&#34;: &#34;Everything else&#34;
      }
    },
    &#34;urgency&#34;: {
      &#34;type&#34;: &#34;score&#34;,
      &#34;instructions&#34;: &#34;How urgent is this request?&#34;,
      &#34;criteria&#34;: [&#34;Not urgent&#34;, &#34;Soon&#34;, &#34;Critical deadline or blocking issue&#34;]
    },
    &#34;churn_risk&#34;: {
      &#34;type&#34;: &#34;noul&#34;,
      &#34;instructions&#34;: &#34;Does the user threaten to cancel or switch to a competitor?&#34;
    },
    &#34;is_phishing&#34;: {
      &#34;type&#34;: &#34;noul&#34;,
      &#34;instructions&#34;: &#34;Is this email a phishing or scam attempt?&#34;
    }
  }
}'
```

The response has an entry under `answers` for each question, with its probabilities and confidence:

```
{
  &#34;model&#34;: &#34;laya&#34;,
  &#34;answers&#34;: {
    &#34;department&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;choice&#34;: &#34;billing&#34;,
      &#34;probabilities&#34;: {&#34;billing&#34;: 0.94, &#34;technical&#34;: 0.03, &#34;sales&#34;: 0.02, &#34;other&#34;: 0.01},
      &#34;confidence&#34;: 0.87
    },
    &#34;urgency&#34;: {
      &#34;type&#34;: &#34;score&#34;,
      &#34;score&#34;: 1.84,
      &#34;legend&#34;: {&#34;0&#34;: &#34;Not urgent&#34;, &#34;1&#34;: &#34;Soon&#34;, &#34;2&#34;: &#34;Critical deadline or blocking issue&#34;},
      &#34;probabilities&#34;: {&#34;0&#34;: 0.01, &#34;1&#34;: 0.16, &#34;2&#34;: 0.83},
      &#34;confidence&#34;: 0.66
    },
    &#34;churn_risk&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;noul&#34;: 0.89},
    &#34;is_phishing&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;noul&#34;: 0.02}
  },
  &#34;usage&#34;: {&#34;input_tokens&#34;: 412, &#34;output_tokens&#34;: 4}
}
```

### Python

Use TypeSafe’s official Python SDK and point it at Ollama. The SDK requires an API key, but Ollama ignores it, so any value works.

```
pip install typesafe-sdk
export TYPESAFE_BASE_URL=http://localhost:11434
export TYPESAFE_API_KEY=ollama
export TYPESAFE_DEFAULT_MODEL=laya
```

```
from typesafe_sdk import Choice, Noul, Score, TypeSafeClient

questions = {
    &#34;department&#34;: Choice(
        instructions=&#34;Which department should handle this email?&#34;,
        criteria={
            &#34;billing&#34;: &#34;Invoices, payments, refunds&#34;,
            &#34;technical&#34;: &#34;Bugs, outages, integrations&#34;,
            &#34;sales&#34;: &#34;Pricing, contracts, demos&#34;,
            &#34;other&#34;: &#34;Everything else&#34;,
        },
    ),
    &#34;urgency&#34;: Score(
        instructions=&#34;How urgent is this request?&#34;,
        criteria=[&#34;Not urgent&#34;, &#34;Soon&#34;, &#34;Critical deadline or blocking issue&#34;],
    ),
    &#34;churn_risk&#34;: Noul(
        instructions=&#34;Does the user threaten to cancel or switch to a competitor?&#34;,
    ),
}

with TypeSafeClient(timeout=120) as client:
    result = client.system_one(state={&#34;body&#34;: &#34;We were billed twice for March.&#34;}, questions=questions)

print(result.choices[&#34;department&#34;].choice)   # billing
print(result.scores[&#34;urgency&#34;].score)        # expected level on the 0-2 rubric
print(result.nouls[&#34;churn_risk&#34;].noul)       # probability the customer threatens to leave
```

Decision models aren’t in the Ollama CLI or the Ollama Python and JavaScript libraries yet. Use the API or the TypeSafe SDK for now.

### More examples

Spam and phishing screen. `null` descriptions let the flag names describe themselves.

```
curl http://localhost:11434/v1/systemone -d '{
  &#34;model&#34;: &#34;laya&#34;,
  &#34;state&#34;: {&#34;from&#34;: &#34;billing@secure-update.example&#34;, &#34;subject&#34;: &#34;Urgent: verify your account now&#34;, &#34;body&#34;: &#34;Your account will be suspended today. Click http://secure-update.example to verify.&#34;},
  &#34;questions&#34;: {
    &#34;spam&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;instructions&#34;: &#34;Is this email spam?&#34;},
    &#34;phishing&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;instructions&#34;: &#34;Is this email a phishing attempt?&#34;},
    &#34;action&#34;: {&#34;type&#34;: &#34;choice&#34;, &#34;instructions&#34;: &#34;What should the mail gateway do with this email?&#34;, &#34;criteria&#34;: {&#34;deliver&#34;: null, &#34;quarantine&#34;: null, &#34;reject&#34;: null}}
  }
}'
```

Tool call moderation. Check an agent’s tool call before it runs.

```
curl http://localhost:11434/v1/systemone -d '{
  &#34;model&#34;: &#34;laya&#34;,
  &#34;state&#34;: &#34;send_email(to=\&#34;all-customers\&#34;, subject=\&#34;FINAL NOTICE: account will be suspended today\&#34;)&#34;,
  &#34;questions&#34;: {
    &#34;harm&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;instructions&#34;: &#34;Could this tool call cause harm?&#34;}
  }
}'
```

### Benchmarks

The numbers below come from Convai Innovations and were measured on the shipped checkpoint: the accuracy on the checkpoint’s own in-task test sets, and the Jev column on TypeSafe’s published figures for Jev 1.13. Sample sizes and prompts differ between the two vendors; treat the Jev comparison as indicative, not an independent head-to-head.

Accuracy by task family (in-task test sets, measured by Convai Innovations):

| Task family | Accuracy | ECE |
| --- | --- | --- |
| Intent and routing | 99.1% | 0.009 |
| Moderation and safety | 96.7% | 0.061 |
| Emotion and tone | 90.6% | 0.018 |
| Inference and fact checking | 88.3% | 0.054 |
| Email triage and phishing | 73.2% | 0.017 |
| Overall (macro, in-task) | 83.8% | 0.060 |
| Held-out task families (zero-shot) | 65.1% | 0.207 |

Latency, measured by Convai Innovations on a single GPU:

| Questions per call | Latency (p50) |
| --- | --- |
| 1 | 38.4 ms |
| 10 batched | 156.0 ms (15.6 ms per question) |
| 50 batched | 721.4 ms (14.4 ms per question) |

Against Jev’s published numbers, Convai reports about 10x lower single-question latency and 16 points higher accuracy across four production workflows. On Convai’s selective-automation setup, gating on confidence ≥ 0.85 automates half the decisions at 92.2% accuracy.

## Training

Convai Innovations trained Laya with RLCD (Reinforcement Learning for Calibrated Decisions). The policy reports a probability distribution, exploration adds zero-mean Gaussian noise to the logits, and the reward is a strictly proper scoring rule (log score plus spherical score, with a ranked probability score for ordinal questions). The maximum expected reward is achieved only when the model outputs true, calibrated probabilities.

- The backbone is ModernBERT-large (395M), fine-tuned end to end, plus a decision head trained from scratch: 2 transformer layers, an option-marker scorer, and an act/escalate head. 421M parameters in all.
- Every option is scored at its own [MASK] marker token, then a softmax is applied over that question’s options. The answer space is defined at request time, so new schemas need no retraining.
- Multi-turn conversations use temporal-difference learning over prefix slices (TD(λ = 1.0)), so credit flows to the earlier turns that led to an outcome without leaking the outcome into the prompt.
- All training data is human-annotated real-world datasets; Convai reports no synthetic training shortcuts.
- The shipped checkpoint is a fine-tune of the base Laya model (7,313 updates, 1 epoch) that adds dedicated email triage and per-cardinality temperature calibration.

The source repo also publishes two sibling checkpoints, `laya-multilingual` (mmBERT-base, 322M, 100+ languages, 1,024-token window) and `laya-typed-decisions` (fine-tuned on the typed-decisions benchmark). Neither ships as part of the `laya` model on Ollama.

## Notes

- Text only, and English only. Each question gets a 512-token budget that covers the instructions, the options, and the state together; longer states are truncated.
- Use `/v1/systemone`. In a regular chat, Laya has no text generation to fall back on.
- Keep inputs short. Every question is scored with the full state and question set in its prompt.
- If none of your options might fit, add a `none` option.
- Calibration is measured on Convai’s benchmark sets. A confidence of 0.9 doesn’t mean the answer is right 90% of the time on your data — test any threshold on your own distribution before you rely on it, and refit it on held-out data if the probabilities matter downstream.
- Keep arithmetic, counting, date comparisons, and multi-hop lookups in deterministic code. Ask Laya whether the state satisfies a stated condition instead.
- If `noul` answers look stuck on “no”, ask the same question as a two-option `choice` with neutral keys and your yes/no wording as the descriptions.
- It can be wrong. Don’t let it be the only check on a high-stakes decision.
- Request bodies can be up to 64 KiB.
