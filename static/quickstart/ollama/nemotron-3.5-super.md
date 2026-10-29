# Nemotron 3.5 Super

Nemotron 3.5 Super is NVIDIA’s vision-language model for coding, reasoning, tool use, and document understanding. It has **120 billion total parameters, with 12 billion active per token**, and combines a hybrid Mamba-2/Transformer mixture-of-experts backbone with a C-RADIO vision encoder. [NVIDIA model card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-BF16)

- **Vision:** ask questions about images, charts, screenshots, and document pages.
- **Tools:** build applications that call functions and incorporate their results.
- **Thinking:** choose whether to generate a reasoning trace before the answer.
- **Long context:** the model supports up to **1 million tokens**. Available memory and runtime settings determine the usable context; prompts, images, history, tool results, and generated tokens share that budget. [Model design](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-BF16#model-design)

The architecture also includes Multi-Token Prediction (MTP) for speculative decoding. NVIDIA publishes [BF16](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-BF16) and [NVFP4](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4) checkpoints, along with a separate [LiLiCorr drafter](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-NVFP4-LiLiCorr).

## License

NVIDIA publishes Nemotron 3.5 Super VL under the [OpenMDW License Agreement, version 1.1](https://openmdw.ai/license/1-1/). See the [publisher’s model card](https://huggingface.co/nvidia/NVIDIA-Nemotron-3.5-Super-VL-120B-A12B-BF16) for training details and evaluation results.
