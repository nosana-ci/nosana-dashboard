![](https://github.com/jmorganca/ollama/assets/3325447/d6be0694-eb35-417b-8f08-47d3b6c2a171)

Mistral is a 7B parameter model, distributed with the Apache license. It is available in both instruct (instruction following) and text completion.

The Mistral AI team has noted that Mistral 7B:

- Outperforms Llama 2 13B on all benchmarks
- Outperforms Llama 1 34B on many benchmarks
- Approaches CodeLlama 7B performance on code, while remaining good at English tasks

### Versions

| Tag | Date | Notes |
| --- | --- | --- |
| `v0.3` `latest` | 05/22/2024 | A new version of Mistral 7B that supports function calling. |
| `v0.2` | 03/23/2024 | A minor release of Mistral 7B |
| `v0.1` | 09/27/2023 | Initial release |

### Function calling

Mistral 0.3 supports function calling with Ollama’s **raw mode**.

Example raw prompt

```
[AVAILABLE_TOOLS] [{&#34;type&#34;: &#34;function&#34;, &#34;function&#34;: {&#34;name&#34;: &#34;get_current_weather&#34;, &#34;description&#34;: &#34;Get the current weather&#34;, &#34;parameters&#34;: {&#34;type&#34;: &#34;object&#34;, &#34;properties&#34;: {&#34;location&#34;: {&#34;type&#34;: &#34;string&#34;, &#34;description&#34;: &#34;The city and state, e.g. San Francisco, CA&#34;}, &#34;format&#34;: {&#34;type&#34;: &#34;string&#34;, &#34;enum&#34;: [&#34;celsius&#34;, &#34;fahrenheit&#34;], &#34;description&#34;: &#34;The temperature unit to use. Infer this from the users location.&#34;}}, &#34;required&#34;: [&#34;location&#34;, &#34;format&#34;]}}}][/AVAILABLE_TOOLS][INST] What is the weather like today in San Francisco [/INST]
```

Example response

```
[TOOL_CALLS] [{&#34;name&#34;: &#34;get_current_weather&#34;, &#34;arguments&#34;: {&#34;location&#34;: &#34;San Francisco, CA&#34;, &#34;format&#34;: &#34;celsius&#34;}}]
```

For more information on raw mode, see the [API documentation](https://github.com/ollama/ollama/blob/main/docs/api.md#request-raw-mode).

### Variations

|  |  |
| --- | --- |
| `instruct` | Instruct models follow instructions |
| `text` | Text models are the base foundation model without any fine-tuning for conversations, and are best used for simple text completion. |

## Usage

### CLI

Instruct:

```
ollama run mistral
```

### API

Example:

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;mistral&#34;,
  &#34;prompt&#34;:&#34;Here is a story about llamas eating grass&#34;
 }'
```

## References

[HuggingFace](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2)

[Mistral AI News Release](https://mistral.ai/news/announcing-mistral-7b/)
