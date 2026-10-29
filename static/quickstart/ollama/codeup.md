![](https://user-images.githubusercontent.com/633681/262490158-929e4fc6-e9f2-482f-b921-886029cc1df9.png)

CodeUp was released by DeepSE. It is based on Llama 2 from Meta, and then fine-tuned for better code generation. This allows it to write better code in a number of languages..

## Get started with CodeUp

The model used in the example below is the CodeUp model, with 13b parameters, which is a code generation model.

### API

1. Start Ollama server (Run `ollama serve`)
2. Run the model

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;codeup&#34;,
  &#34;prompt&#34;:&#34;Write a C++ code to find the longest common substring in two strings.&#34;
 }'
```

### CLI

1. Install Ollama
2. Open the terminal and run `ollama run codeup`

Note: The `ollama run` command performs an `ollama pull` if the model is not already downloaded. To download the model without running it, use `ollama pull codeup`

## Memory requirements

- 13b models generally require at least 16GB of RAM

If you run into issues with higher quantization levels, try using the q4 model or shut down any other programs that are using a lot of memory.

## Model variants

By default, Ollama uses 4-bit quantization. To try other quantization levels, please try the other tags. The number after the q represents the number of bits used for quantization (i.e. q4 means 4-bit quantization). The higher the number, the more accurate the model is, but the slower it runs, and the more memory it requires.

| **Aliases** |
| --- |
| latest, 13b, 13b-llama2, 13b-llama2-chat, 13b-llama2-chat-q4_0 |

## Model source

**CodeUp source on Ollama**

13b parameters source: [DeepSE](https://huggingface.co/deepse/CodeUp-Llama-2-13b-chat-hf)

## References

[GitHub Repo for CodeUp](https://github.com/juyongjiang/CodeUp#papers)
