# Nemotron-3-Nano

**Nemotron 3 Nano 4B**

```
ollama run nemotron-3-nano:4b
```

**Nemotron 3 Nano 30B**

```
ollama run nemotron-3-nano:30b
```

**Ollama’s Cloud**

```
ollama run nemotron-3-nano:30b-cloud
```

### What is Nemotron?

NVIDIA Nemotron™ is a family of open models with open weights, training data, and recipes, delivering leading efficiency and accuracy for building specialized AI agents.

Nemotron 3 Nano is a large language model (LLM) trained from scratch by NVIDIA, and designed as a unified model for both reasoning and non-reasoning tasks. It responds to user queries and tasks by first generating a reasoning trace and then concluding with a final response. The model’s reasoning capabilities can be configured through a flag in the chat template. If the user prefers the model to provide its final answer without intermediate reasoning traces, it can be configured to do so, albeit with a slight decrease in accuracy for harder prompts that require reasoning. Conversely, allowing the model to generate reasoning traces first generally results in higher-quality final solutions to queries and tasks.

The model employs a hybrid Mixture-of-Experts (MoE) architecture, consisting of 23 Mamba-2 and MoE layers, along with 6 Attention layers. Each MoE layer includes 128 experts plus 1 shared expert, with 6 experts activated per token. The model has 3.5B active parameters and 30B parameters in total.

The supported languages include: English, German, Spanish, French, Italian, and Japanese. Improved using Qwen.

## License/Terms of Use

Governing Terms: Use of this model is governed by the [NVIDIA Open Model License Agreement](https://www.nvidia.com/en-us/agreements/enterprise-software/nvidia-open-model-license/).
