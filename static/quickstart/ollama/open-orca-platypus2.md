![](https://user-images.githubusercontent.com/633681/262757252-66e5d8a6-40d8-4cd8-b4b9-30d3f7dc1466.png)

The OpenOrca Platypus2 model is a 13 billion parameter model which is a merge of the OpenOrca OpenChat model and the Garage-bAInd Platypus2-13B model which are both fine tunings of the Llama 2 model. It is designed to be a general-use model that can be used for chat, text generation, and code generation.

## Get started with OpenOrca Platypus 2

The model used in the example below is the OpenOrca Platypus 2 model, with 13b parameters, which is a general-use model.

### API

1. Start Ollama server (Run `ollama serve`)
2. Run the model

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;open-orca-platypus2&#34;,
  &#34;prompt&#34;:&#34;Tell me a joke about ropes.&#34;
 }'
```

### CLI

1. Install Ollama
2. Open the terminal and run `ollama run open-orca-platypus2`

Note: The `ollama run` command performs an `ollama pull` if the model is not already downloaded. To download the model without running it, use `ollama pull open-orca-platypus2`

## Memory requirements

- 13b models generally require at least 16GB of RAM

If you run into issues with higher quantization levels, try using the q4 model or shut down any other programs that are using a lot of memory.

## Model variants

By default, Ollama uses 4-bit quantization. To try other quantization levels, please try the other tags. The number after the q represents the number of bits used for quantization (i.e. q4 means 4-bit quantization). The higher the number, the more accurate the model is, but the slower it runs, and the more memory it requires.

| **Aliases** |
| --- |
| latest, 13b, 13b-q4_0 |

## Model source

**OpenOrca Platypus 2 source on Ollama**

13b parameters source: [OpenOrca](https://huggingface.co/Open-Orca/OpenOrca-Platypus2-13B)

## References

[Platypus: Quick, Cheap, and Powerful Refinement of LLMs](https://arxiv.org/abs/2308.07317)
