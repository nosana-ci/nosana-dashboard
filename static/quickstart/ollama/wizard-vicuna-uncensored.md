Wizard Vicuna Uncensored is a 7B, 13B, and 30B parameter model based on Llama 2 uncensored by Eric Hartford. The models were trained against LLaMA-7B with a subset of the dataset, responses that contained alignment / moralizing were removed.

## Get started with Wizard Vicuna Uncensored

The model used in the example below is the Wizard Vicuna Uncensored model, with 7b parameters, which is a general-use model.

### API

1. Start Ollama server (Run `ollama serve`)
2. Run the model

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;wizard-vicuna-uncensored&#34;,
  &#34;prompt&#34;:&#34;Who made Rose promise that she would never let go?&#34;
 }'
```

### CLI

1. Install Ollama
2. Open the terminal and run `ollama run wizard-vicuna-uncensored`

Note: The `ollama run` command performs an `ollama pull` if the model is not already downloaded. To download the model without running it, use `ollama pull wizard-vicuna-uncensored`

## Memory requirements

- 7b models generally require at least 8GB of RAM
- 13b models generally require at least 16GB of RAM
- 30b models generally require at least 32GB of RAM

If you run into issues with higher quantization levels, try using the q4 model or shut down any other programs that are using a lot of memory.

## Model variants

By default, Ollama uses 4-bit quantization. To try other quantization levels, please try the other tags. The number after the q represents the number of bits used for quantization (i.e. q4 means 4-bit quantization). The higher the number, the more accurate the model is, but the slower it runs, and the more memory it requires.

| **Aliases** |
| --- |
| latest, 7b, 7b-q4_0 |
| 13b, 13b-q4_0 |
| 30b, 30b-q4_0 |

## Model source

**Wizard Vicuna Uncensored source on Ollama**

7b parameters original source: [Eric Hartford](https://huggingface.co/ehartford/Wizard-Vicuna-7B-Uncensored)

13b parameters original source: [Eric Hartford](https://huggingface.co/ehartford/Wizard-Vicuna-13B-Uncensored)

30b parameters original source: [Eric Hartford](https://huggingface.co/ehartford/Wizard-Vicuna-30B-Uncensored)
