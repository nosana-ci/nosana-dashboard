![Technology Innovation Institute Logo](https://github.com/jmorganca/ollama/assets/251292/af914f26-9f0b-4e66-947a-33ae0d558ccf)

Falcon is a family of high-performing large language models model built by the Technology Innovation Institute (TII), a research center part of Abu Dhabi government’s advanced technology research council overseeing technology research.

### CLI

```
ollama run falcon &#34;Why is the sky blue?&#34;
```

### API

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;falcon&#34;,
  &#34;prompt&#34;: &#34;Why is the sky blue?&#34;
}'
```

## Parameter counts

| Parameter Count | Recommended memory |  |  |
| --- | --- | --- | --- |
| 7 billion | 8GB | [View](https://ollama.com/library/falcon:7b) | `ollama run falcon:7b` |
| 40 billion | 32GB | [View](https://ollama.com/library/falcon:40b) | `ollama run falcon:40b` |
| 180 billion | 192GB | [View](https://ollama.com/library/falcon:180b) | `ollama run falcon:180b` |

## Variations

|  |  |
| --- | --- |
| `chat` | Chat models are fine-tuned on chat and instruction datasets with a mix of several large-scale conversational datasets. |
| `instruct` | Instruct models follow instructions and are fine-tuned on the [baize](https://www.google.com/search?q=baize+dataset&oq=baize+data&aqs=chrome.0.0i512j69i57j0i10i15i22i30i625j0i390i650.1387j0j7&sourceid=chrome&ie=UTF-8) instructional dataset. |
| `text` | Text models are the base foundation model without any fine-tuning for conversations, and are best used for simple text completion. |

## Falcon 180B

As of September 2023, the 180 billion parameter model, Falcon 180B, is the best-performing openly released LLM. It sits somewhere in between OpenAI’s GPT 3.5 and GPT 4. For running Falcon 180B, a powerful system is recommended with at least 192GB of total memory.

Note: Falcon 180B is released under a different license than its smaller siblings that restricts commercial use under certain conditions. See the [model details](https://ollama.com/library/falcon:180b) and license for more information.

## More information

- [TII’s website](https://www.tii.ae/)
- [Falcon 180B announcement](https://falconllm.tii.ae/)
- [TII on HuggingFace](https://huggingface.co/tiiuae)
