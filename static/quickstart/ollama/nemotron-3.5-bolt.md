# Nemotron 3.5 Bolt

Nemotron 3.5 Bolt is NVIDIA’s compact vision-language model for local coding, reasoning, and tool use.

## Bolt E4B

Bolt E4B is an **8-billion-parameter model, with 4 billion effective**, post-trained by NVIDIA from Gemma 4 E4B. It is designed for fast local conversations, instruction following, and multi-turn tool use. Its companion DFlash draft accelerates generation through speculative decoding. [NVIDIA BF16 model card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-BF16) · [NVIDIA Q4_K_M model card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-4GB)

```
ollama run nemotron-3.5-bolt:e4b
```

E4B is supported on both Windows/Linux and Apple Silicon. [NVIDIA DFlash model card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-E4B-BF16-DFlash-NVFP4)

## Bolt 74B-A9B

It has **74 billion total parameters, with 9 billion active per token**, and combines a Mamba-2/Transformer mixture-of-experts backbone with a C-RADIO vision encoder. [NVIDIA model card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Bolt-74B-A9B-24GB-GGUF)

NVIDIA developed Bolt from Nemotron 3.5 Super through model compression and further training. Its published GGUF uses quantization-aware distillation for **IQ2_XXS expert weights**, alongside NVFP4 and Q8_0 for other layers.

- **Vision:** Work with images, screenshots, charts, and documents.
- **Tools:** Call functions and use their results in multi-turn tasks.
- **Thinking:** Enable or disable reasoning before the answer.
- **Context:** Supports up to **256K tokens**. Usable context depends on available memory; images, conversation history, tool results, and output share that budget. ollama run nemotron-3.5-bolt

### Compatibility

**Apple Silicon / Metal is not currently supported** for 74B-A9B. Memory requirements depend on context size, visual inputs, and speculative decoding.

## License

Released under the [OpenMDW License Agreement, version 1.1](https://openmdw.ai/license/1-1/). See the NVIDIA model cards above for training details and evaluations.
