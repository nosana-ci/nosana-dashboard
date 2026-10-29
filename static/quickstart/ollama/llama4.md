![image.png](https://ollama.com/assets/library/llama4/e7b65449-da66-4a50-b36c-d0c2359295b4)

The Llama 4 collection of models are natively multimodal AI models that enable text and multimodal experiences. These two models leverage a mixture-of-experts (MoE) architecture and support native multimodality (image input).

**Supported languages:** Arabic, English, French, German, Hindi, Indonesian, Italian, Portuguese, Spanish, Tagalog, Thai, and Vietnamese.

**Input:** multilingual text, image

**Output:** multilingual text, code

### Models

#### Llama 4 Scout

```
ollama run llama4:scout
```

109B parameter MoE model with 17B active parameters

#### Llama 4 Maverick

```
ollama run llama4:maverick
```

400B parameter MoE model with 17B active parameters

### Intended Use

**Intended Use Cases:** Llama 4 is intended for commercial and research use in multiple languages. Instruction tuned models are intended for assistant-like chat and visual reasoning tasks, whereas pretrained models can be adapted for natural language generation. For vision, Llama 4 models are also optimized for visual recognition, image reasoning, captioning, and answering general questions about an image. The Llama 4 model collection also supports the ability to leverage the outputs of its models to improve other models including synthetic data generation and distillation. The Llama 4 Community License allows for these use cases.

**Out-of-scope**: Use in any manner that violates applicable laws or regulations (including trade compliance laws). Use in any other way that is prohibited by the Acceptable Use Policy and Llama 4 Community License. Use in languages or capabilities beyond those explicitly referenced as supported in this model card.

Note:

1. Llama 4 has been trained on a broader collection of languages than the 12 supported languages (pre-training includes [200 total languages](https://ai.meta.com/research/no-language-left-behind/)). Developers may fine-tune Llama 4 models for languages beyond the 12 supported languages provided they comply with the Llama 4 Community License and the Acceptable Use Policy. Developers are responsible for ensuring that their use of Llama 4 in additional languages is done in a safe and responsible manner.
2. Llama 4 has been tested for image understanding up to 5 input images. If leveraging additional image understanding capabilities beyond this, Developers are responsible for ensuring that their deployments are mitigated for risks and should perform additional testing and tuning tailored to their specific applications.

### Benchmarks

Category Benchmark # Shots Metric Llama 3.3 70B Llama 3.1 405B Llama 4 Scout Llama 4 Maverick Image Reasoning MMMU 0 accuracy No multimodal support 69.4 73.4 MMMU Pro^ 0 accuracy 52.2 59.6 MathVista 0 accuracy 70.7 73.7 Image Understanding ChartQA 0 relaxed_accuracy 88.8 90.0 DocVQA (test) 0 anls 94.4 94.4 Code LiveCodeBench (10/01/2024-02/01/2025) 0 pass@1 33.3 27.7 32.8 43.4 Reasoning & Knowledge MMLU Pro 0 macro_avg/acc 68.9 73.4 74.3 80.5 GPQA Diamond 0 accuracy 50.5 49.0 57.2 69.8 Multilingual MGSM 0 average/em 91.1 91.6 90.6 92.3 Long Context MTOB (half book) eng->kgv/kgv->eng - chrF Context window is 128K 42.2 / 36.6 54.0 / 46.4 MTOB (full book) eng->kgv/kgv->eng - chrF 39.7 / 36.3 50.8 / 46.7 *reported numbers for MMMU Pro is the average of Standard and Vision tasks

### Reference

- Meta Llama 4 [post](https://ai.meta.com/blog/llama-4-multimodal-intelligence/)
