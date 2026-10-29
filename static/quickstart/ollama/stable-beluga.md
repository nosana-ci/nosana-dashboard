![](https://user-images.githubusercontent.com/633681/263119827-dbb7315b-554f-4865-86f4-44e1391ab460.png)

Stable Beluga is based on Llama 2 and then fine-tuned on an Orca-style dataset. It is available in 7B, 13B, and 70B parameter sizes. It was created by Stability AI.

## Get started with Stable Beluga

The model used in the example below is the Stable Beluga model, with 7b parameters, which is a general-use model.

### API

1. Start Ollama server (Run `ollama serve`)
2. Run the model

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;stable-beluga&#34;,
  &#34;prompt&#34;:&#34;Explain the process of how a refrigerator works to keep the contents inside cold.&#34;
 }'
```

### CLI

1. Install Ollama
2. Open the terminal and run `ollama run stable-beluga`

Note: The `ollama run` command performs an `ollama pull` if the model is not already downloaded. To download the model without running it, use `ollama pull stable-beluga`

## Memory requirements

- 7b models generally require at least 8GB of RAM
- 13b models generally require at least 16GB of RAM
- 70b models generally require at least 64GB of RAM

If you run into issues with higher quantization levels, try using the q4 model or shut down any other programs that are using a lot of memory.

## Model variants

By default, Ollama uses 4-bit quantization. To try other quantization levels, please try the other tags. The number after the q represents the number of bits used for quantization (i.e. q4 means 4-bit quantization). The higher the number, the more accurate the model is, but the slower it runs, and the more memory it requires.

| **Aliases** |
| --- |
| latest, 7b, 7b-q4_0 |
| 13b, 13b-q4_0 |
| 70b, 70b-q4_0 |

## Model source

**Stable Beluga source on Ollama**

7b parameters original source: [Stability AI](https://huggingface.co/stabilityai/StableBeluga-7B)

13b parameters original source: [Stability AI](https://huggingface.co/stabilityai/StableBeluga-13B)

70b parameters original source: [Stability AI](https://huggingface.co/stabilityai/StableBeluga2)
