![](https://user-images.githubusercontent.com/633681/263121166-8b16834a-1da2-4a68-8aac-13d19775e7d7.png)

WizardLM is a 70B parameter model based on Llama 2 trained by WizardLM.

## Get started with WizardLM

The model used in the example below is the WizardLM model, with 70b parameters, which is a general-use model.

### API

1. Start Ollama server (Run `ollama serve`)
2. Run the model

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;wizardlm:70b-llama2-q4_0&#34;,
  &#34;prompt&#34;:&#34;Why is the sky blue?&#34;
 }'
```

### CLI

1. Install Ollama
2. Open the terminal and run `ollama run wizardlm:70b-llama2-q4_0`

Note: The `ollama run` command performs an `ollama pull` if the model is not already downloaded. To download the model without running it, use `ollama pull wizardlm:70b-llama2-q4_0`

## Memory requirements

- 70b models generally require at least 64GB of RAM

If you run into issues with higher quantization levels, try using the q4 model or shut down any other programs that are using a lot of memory.

## Model variants

By default, Ollama uses 4-bit quantization. To try other quantization levels, please try the other tags. The number after the q represents the number of bits used for quantization (i.e. q4 means 4-bit quantization). The higher the number, the more accurate the model is, but the slower it runs, and the more memory it requires.

## Model source

**WizardLM source on Ollama**

70b parameters source: [The Bloke](https://huggingface.co/TheBloke/WizardLM-70B-V1.0-GGML)

70b parameters original source: [WizardLM](https://huggingface.co/WizardLM/WizardLM-70B-V1.0)
