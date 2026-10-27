![](https://user-images.githubusercontent.com/633681/262739492-985b8e69-35be-4eaf-a954-c452c4363c72.png)

Nous Hermes was released by Nous Research. There are two main variants here, a 13B parameter model based on Llama, and a 7B and 13B parameter model based on Llama 2. They are all general-use models trained with the same datasets.

## Get started with Nous Hermes

The model used in the example below is the Nous Hermes Llama 2 model, with 7b parameters, which is a general chat model.

### API

1. Start Ollama server (Run `ollama serve`)
2. Run the model

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;nous-hermes&#34;,
  &#34;prompt&#34;:&#34;Explain the process of how a refrigerator works to keep the contents inside cold.&#34;
 }'
```

### CLI

1. Install Ollama
2. Open the terminal and run `ollama run nous-hermes`

Note: The `ollama run` command performs an `ollama pull` if the model is not already downloaded. To download the model without running it, use `ollama pull nous-hermes`

## Memory requirements

- 7b models generally require at least 8GB of RAM
- 13b models generally require at least 16GB of RAM

If you run into issues with higher quantization levels, try using the q4 model or shut down any other programs that are using a lot of memory.

## Model variants

Ollama offers many variants of the Nous Hermes model that are quantized based on the official models to run well locally.

**Nous Hermes Llama 2** is the original Nous Hermes model based on the original Llama model.

*Example: `ollama run nous-hermes`*

**Nous Hermes Llama 1** is the original Nous Hermes model based on the original Llama model.

*Example: `ollama run nous-hermes:13b-q4_0`*

By default, Ollama uses 4-bit quantization. To try other quantization levels, please try the other tags. The number after the q represents the number of bits used for quantization (i.e. q4 means 4-bit quantization). The higher the number, the more accurate the model is, but the slower it runs, and the more memory it requires.

| **Aliases** |
| --- |
| latest, 7b, 7b-llama2, 7b-llama2-q4_0 |
| 13b, 13b-llama2, 13b-llama2-q4_0 |

## Model source

**Nous Hermes Llama 2 source on Ollama**

7b parameters original source: [Nous Research](https://huggingface.co/NousResearch/Nous-Hermes-llama-2-7b)

13b parameters original source: [Nous Research](https://huggingface.co/NousResearch/Nous-Hermes-Llama2-13b)

**Nous Hermes Llama 1 source on Ollama**

13b parameters original source: [Nous Research](https://huggingface.co/NousResearch/Nous-Hermes-13b)
