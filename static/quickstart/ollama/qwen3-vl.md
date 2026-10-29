![Qwen 3 banner](https://ollama.com/assets/library/qwen3-vl/d784b840-5f70-4a60-86bc-f10ad6c0627f)

Qwen3-VL models require [Ollama 0.12.7](https://github.com/ollama/ollama/releases)

Qwen3-VL is the most powerful vision-language model in the Qwen family to date.

In this generation, there are improvements to the model in many areas: its understanding and generating text, perceiving and reasoning about visual content, supporting longer context lengths, understanding spatial relationships and dynamic videos, or interacting with AI agents — Qwen3-VL shows clear and significant progress in every area.

### Models

**2B**

```
ollama run qwen3-vl:2b
```

**4B**

```
ollama run qwen3-vl:4b
```

**8B**

```
ollama run qwen3-vl:8b
```

**30B**

```
ollama run qwen3-vl:30b
```

**32B**

```
ollama run qwen3-vl:32b
```

**235B**

```
ollama run qwen3-vl:235b
```

```
ollama run qwen3-vl:235b-cloud
```

### Key features

**Visual Agent Capabilities**: Qwen3-VL can operate computer and mobile interfaces — recognize GUI elements, understand button functions, call tools, and complete tasks. It achieves top global performance on benchmarks like OS World, and using tools significantly improves its performance on fine-grained perception tasks.

**Superior Text-Centric Performance**: Qwen3-VL employs early-stage joint pretraining of text and visual modalities, continuously strengthening its language capabilities. Its performance on text-based tasks matches that of Qwen3-235B-A22B-2507 — the flagship language model — making it a truly “text-grounded, multimodal powerhouse” for the next generation of vision-language models.

**Greatly Improved Visual Coding**: It can now generate code from images or videos — for example, turning a design mockup into Draw.io, HTML, CSS, or JavaScript code — making “what you see is what you get” visual programming a reality.

**Much Better Spatial Understanding**: 2D grounding from absolute coordinates to relative coordinates. It can judge object positions, viewpoint changes, and occlusion relationships. It supports 3D grounding, laying the foundation for complex spatial reasoning and embodied AI applications.

**Long Context & Long Video Understanding**: All models natively support 256K tokens of context, expandable up to 1 million tokens. This means you can input hundreds of pages of technical documents, entire textbooks, or even two-hour videos — and the model will remember everything and retrieve details accurately, down to the exact second in videos.

**Stronger Multimodal Reasoning (Thinking Version)**: The Thinking model is specially optimized for STEM and math reasoning. When facing complex subject questions, it can notice fine details, break down problems step by step, analyze cause and effect, and give logical, evidence-based answers. It achieves strong performance on reasoning benchmarks like MathVision, MMMU, and MathVista.

**Upgraded Visual Perception & Recognition**: By improving the quality and diversity of pre-training data, the model can now recognize a much wider range of objects — from celebrities, anime characters, products, and landmarks, to animals and plants — covering both everyday life and professional “recognize anything” needs.

**Better OCR Across More Languages & Complex Scenes**: OCR now supports 32 languages (up from 10), covering more countries and regions. It performs more reliably under challenging real-world conditions like poor lighting, blur, or tilted text. Recognition accuracy for rare characters, ancient scripts, and technical terms has also improved significantly. Its ability to understand long documents and reconstruct fine structures is further enhanced.
