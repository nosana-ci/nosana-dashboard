![logo.svg](https://ollama.com/assets/library/glm-ocr/c08dfddc-0734-4983-a450-3466d01594ee)

GLM-OCR is a multimodal OCR model for complex document understanding, built on the GLM-V encoder–decoder architecture. The model integrates the CogViT visual encoder pre-trained on large-scale image–text data, a lightweight cross-modal connector with efficient token downsampling, and a GLM-0.5B language decoder.

![image.png](https://ollama.com/assets/library/glm-ocr/7b4bd5ed-e6bc-4f36-889d-a02fa36e88ae)

### Usage

#### Text recognition

```
ollama run glm-ocr Text Recognition: ./image.png
```

#### Table recognition

```
ollama run glm-ocr Table Recognition: ./image.png
```

#### Figure recognition

```
ollama run glm-ocr Figure Recognition: ./image.png
```

### Key features

- **State-of-the-Art Performance**: Achieves a score of 94.62 on OmniDocBench V1.5, ranking #1 overall, and delivers state-of-the-art results across major document understanding benchmarks, including formula recognition, table recognition, and information extraction.
- **Optimized for Real-World Scenarios**: Designed and optimized for practical business use cases, maintaining robust performance on complex tables, code-heavy documents, seals, and other challenging real-world layouts.
- **Efficient Inference**: With only 0.9B parameters, GLM-OCR supports deployment via vLLM, SGLang, and Ollama, significantly reducing inference latency and compute cost, making it ideal for high-concurrency services and edge deployments.
- **Easy to Use**: Fully open-sourced and equipped with a comprehensive [SDK](https://github.com/zai-org/GLM-OCR) and inference toolchain, offering simple installation, one-line invocation, and smooth integration into existing production pipelines.
