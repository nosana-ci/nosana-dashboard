![OpenAI gpt-oss banner](https://ollama.com/assets/library/gpt-oss/e9da5025-e172-441d-9f06-8dfa797da9b0)

### Welcome OpenAI’s gpt-oss!

Ollama partners with OpenAI to bring its latest state-of-the-art open weight models to Ollama. The two models, 20B and 120B, bring a whole new local chat experience, and are designed for powerful reasoning, agentic tasks, and versatile developer use cases.

### Get started

You can get started by [downloading the latest Ollama version](https://ollama.com/download).

The model can be downloaded directly in Ollama’s new app or via the terminal:

**ollama run gpt-oss:20b**

**ollama run gpt-oss:120b**

### Feature highlights

- **Agentic capabilities:** Use the models’ native capabilities for function calling, web browsing (Ollama is introducing built-in web search that can be optionally enabled), python tool calls, and structured outputs.
- **Full chain-of-thought:** Gain complete access to the model’s reasoning process, facilitating easier debugging and increased trust in outputs.
- **Configurable reasoning effort:** Easily adjust the reasoning effort (low, medium, high) based on your specific use case and latency needs.
- **Fine-tunable:** Fully customize models to your specific use case through parameter fine-tuning.
- **Permissive Apache 2.0 license:** Build freely without copyleft restrictions or patent risk—ideal for experimentation, customization, and commercial deployment.

![benchmark](https://ollama.com/assets/library/gpt-oss/d29a500d-303f-4d24-b557-a8247d17ed4c)

### Quantization - MXFP4 format

OpenAI utilizes quantization to reduce the memory footprint of the gpt-oss models. The models are post-trained with quantization of the mixture-of-experts (MoE) weights to MXFP4 format, where the weights are quantized to 4.25 bits per parameter. The MoE weights are responsible for 90+% of the total parameter count, and quantizing these to MXFP4 enables the smaller model to run on systems with as little as 16GB memory, and the larger model to fit on a single 80GB GPU.

Ollama is supporting the MXFP4 format natively without additional quantizations or conversions. New kernels are developed for Ollama’s new engine to support the MXFP4 format.

Ollama collaborated with OpenAI to benchmark against their reference implementations to ensure Ollama’s implementations have the same quality.

### 20B parameter model

![gpt-oss 20B](https://ollama.com/assets/library/gpt-oss/343d558d-a3bc-472e-9956-37fdc3cc4f6c)

gpt-oss-20b model is designed for lower latency, local, or specialized use-cases.

### 120B parameter model

![gpt-oss 120B](https://ollama.com/assets/library/gpt-oss/51b69d33-c747-4117-ba76-a6efa1b0a986)

### Reference

- [OpenAI launch blog](https://openai.com/index/introducing-gpt-oss)
- [OpenAI model card](https://openai.com/index/gpt-oss-model-card/)
- [NVIDIA RTX blog](https://blogs.nvidia.com/blog/rtx-ai-garage-openai-oss)
- [NVIDIA cloud to edge](https://developer.nvidia.com/blog/delivering-1-5-m-tps-inference-on-nvidia-gb200-nvl72-nvidia-accelerates-openai-gpt-oss-models-from-cloud-to-edge/)
