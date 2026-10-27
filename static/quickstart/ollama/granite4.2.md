![](https://ollama.com/assets/library/granite3.2/90c5e567-0004-425c-a17a-1b846c2b5d3d)

### Granite 4.2 models

Granite 4.2 language models are a family of state-of-the-art open foundation models featuring dense decoder-only architectures. They natively support multilingual capabilities, a wide range of coding tasks, retrieval-augmented generation (RAG), tool usage, structured JSON output, and extended reasoning via a built-in thinking mode.

All models are publicly released under the Apache 2.0 license, allowing free use for both research and commercial purposes. The data curation and training processes were specifically designed for enterprise scenarios and customization, incorporating governance, risk, and compliance (GRC) evaluations alongside IBM’s standard data clearance and document quality review procedures.

#### Thinking Mode

Granite 4.2 features a built-in thinking capability controlled by two parameters:

| Parameter | Values | Effect |
| --- | --- | --- |
| `enable_thinking` | `true` (default) / `false` | When `true`, the model opens a `<think>…</think>` block before answering, allowing it to reason step-by-step before producing its final response. When `false`, thinking is skipped entirely. |
| `reasoning_effort` | `&#34;low&#34;` / `&#34;high&#34;` (default) | When set to `&#34;low&#34;`, the model appends `{reasoning effort: low}` to the user turn, signalling a faster, less thorough reasoning pass. Use `&#34;high&#34;` (or omit the parameter) for full reasoning depth. |

**How it works under the hood:** the chat template wraps the generation prompt with `<|im_start|>assistant\n<think>\n` when thinking is enabled. The model produces its chain-of-thought inside the `<think>` block, then emits its final answer after `</think>`. In history, earlier thinking blocks are truncated to `<think>\n</think>` to save context (controlled by `truncate_history_thinking`, which defaults to `true`).

**Using thinking with Ollama:**

Use `/set think` with a level to control how much the model reasons before responding:

| Command | Effect |
| --- | --- |
| `/set think` | Enable thinking at the default level |
| `/set nothink` | Disable thinking — fastest, direct answers |
| `/set think low` | Low reasoning effort — light thinking pass |
| `/set think medium` | Medium reasoning effort |
| `/set think high` | High reasoning effort |

Example:

```
/set think high
What is the difference between a mutex and a semaphore?
```

Via the REST API, pass `think` in `options`:

```
{
  &#34;model&#34;: &#34;granite4.2:8b&#34;,
  &#34;messages&#34;: [
    {&#34;role&#34;: &#34;user&#34;, &#34;content&#34;: &#34;What is the difference between a mutex and a semaphore?&#34;}
  ],
  &#34;options&#34;: {
    &#34;think&#34;: &#34;high&#34;
  }
}
```

#### Default Hyperparameters

Granite 4.2 models ship with a `generation_config.json` in their Hugging Face repository that declares recommended default inference hyperparameters. When present, these values are automatically injected into the Ollama Modelfile at publish time so that every quantized variant inherits the model authors’ recommended settings without any manual override.

The following parameters are extracted when found in `generation_config.json` and written as `PARAMETER` directives in the Modelfile:

| `generation_config.json` key | Ollama Modelfile parameter | Description |
| --- | --- | --- |
| `temperature` | `temperature` | Sampling temperature — controls output randomness |
| `top_p` | `top_p` | Nucleus sampling probability threshold |
| `top_k` | `top_k` | Top-K sampling limit |
| `max_new_tokens` | `num_ctx` | Maximum context / generation length |

Example Modelfile snippet produced when all four keys are present:

```
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 50
PARAMETER num_ctx 8192
```

**Note:** Parameters sourced from `generation_config.json` are written **before** any static `params.json` entries, so the static file can override individual values per-model if needed.

#### Running

Example of running the default model (i.e., typically, this is the `Q4_K_M` quantization):

```
ollama run granite4.2:8b
```

To run other quantizations (e.g., `Q8_0`):

```
ollama run granite4.2:8b-q8_0
```

#### Supported Languages

Supported Languages: English, German, Spanish, French, Japanese, Portuguese, Arabic, Czech, Italian, Korean, Dutch, and Chinese. Users may finetune Granite 4.2 models for languages beyond these languages.

#### Intended Use

This model is designed to handle general instruction-following tasks and can be integrated into AI assistants across various domains, including business applications.

The model is designed to respond to general instructions and can be used to build AI assistants for multiple domains, including business applications.

#### Capabilities

- Summarization
- Text classification
- Text extraction
- Question-answering
- Retrieval Augmented Generation (RAG)
- Code related tasks
- Function-calling tasks
- Multilingual dialog use cases
- Fill-In-the-Middle (FIM) code completions
- Thinking / extended reasoning (enable_thinking, reasoning_effort)

#### Learn more

- Developers: Granite Team, IBM
- Website: [Granite Docs](https://www.ibm.com/granite/docs)
- GitHub Repository: [ibm-granite/granite-language-models](https://github.com/ibm-granite/granite-language-models)
- Hugging Face: [Granite 4.2 Language Models](https://huggingface.co/collections/ibm-granite/granite-42-language-models)
- License: [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)
