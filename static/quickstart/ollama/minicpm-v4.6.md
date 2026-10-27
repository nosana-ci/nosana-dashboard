![MiniCPM-V.png](https://ollama.com/assets/openbmb/minicpm-v2.6/452bfaf1-53f4-4485-8a92-e4a1a05abf38)

## MiniCPM-V 4.6

**MiniCPM-V 4.6** is our most edge-deployment-friendly model to date. The model is built based on SigLIP2-400M and the Qwen3.5-0.8B LLM. It inherents the strong single-image, multi-image, and video understanding capabilities of MiniCPM-V family, while significantly improving computation efficiency. It also introduces mixed 4x/16x visual token compression. Notable features of MiniCPM-V 4.6 include:

- 🔥 **Leading Foundation Capability.** MiniCPM-V 4.6 scores 13 on the Artificial Analysis Intelligence Index benchmark, outperforming Qwen3.5-0.8B’s score of 10 with 19x fewer token cost, and Qwen3.5-0.8B-Thinking’s score of 11 with 43x fewer token cost. It also surpasses the larger Ministral 3 3B (score of 11).
- 💪 **Strong Multimodal Capability.** MiniCPM-V 4.6 outperforms Qwen3.5-0.8B on most vision-language understanding tasks, and reaches Qwen3.5 2B-level capability on many benchmarks including OpenCompass, RefCOCO, HallusionBench, MUIRBench, and OCRBench.
- 🚀 **Ultra-Efficient Architecture.** Based on the latest technique in [LLaVA-UHD v4](https://github.com/THUMAI-Lab/LLaVA-UHD-v4), MiniCPM-V 4.6 reduces the visual encoding computation FLOPs by more than 50%. It enables MiniCPM-V 4.6 to achieve better efficiency to even smaller models, achieving x2.4 token throughput compared to Qwen3.5-0.8B. It also supports mixed 4x/16x visual token compression rate, allowing flexible switching between accuracy and speed.
- 📱 **Broad Mobile Platform Coverage.** MiniCPM-V 4.6 can be deployed across all three mainstream mobile platforms — iOS, Android, and HarmonyOS. With every edge adaptation code open-sourced, developers can reproduce the on-device experience in [just a few steps](https://ollama.com/#deploy-minicpm-v-46-on-ios-android-and-harmonyos-platforms-).
- 🛠️ **Developer Friendly.** MiniCPM-V 4.6 is adapted to [inference frameworks](https://ollama.com/#supported-inference-and-training-frameworks) such as vLLM, SGLang, llama.cpp, Ollama, and supports [fine-tuning ecosystems](https://ollama.com/#supported-inference-and-training-frameworks) such as SWIFT and LLaMA-Factory. Developers can quickly customize models for new domains and tasks on consumer-grade GPUs. We provide multiple quantized variants across GGUF, BNB, AWQ, and GPTQ formats.

[!NOTE] If you have any questions, please feel free to submit an issue here: [MiniCPM-V Issues](https://github.com/OpenBMB/MiniCPM-V/issues). We will actively respond to all questions from the community.
