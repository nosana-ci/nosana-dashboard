![](https://ollama.com/assets/library/rnj-1/39181423-7841-47ee-bfe6-7b12966b45d1)

This model requires [Ollama 0.13.3](https://github.com/ollama/ollama/releases/tag/v0.13.3-rc0) or later.

Rnj-1 is a family of 8B parameter open-weight, dense models trained from scratch by Essential AI, optimized for code and STEM with capabilities on par with SOTA open-weight models. These models perform well across a range of programming languages and boast strong agentic capabilities (e.g., inside agentic frameworks like mini-SWE-agent), while also excelling at tool-calling. They additionally exhibit strong capabilities in math and science. Herein, rnj-1 refers to the base model, while rnj-1-instruct refers to the post-trained instruction tuned model.

![image.png](https://ollama.com/assets/library/rnj-1/d40fd93f-fe0c-4c6b-ac44-06b6c9b8ae8e)

### Highlights of abilities

- **Code generation:** Both `rnj-1-instruct` and `rnj-1` demonstrate strong code generation abilities as measured on tasks like HumanEval+, MBPP+, BigCodeBench, and LiveCodeBench v6. Both models compete with the strongest open weight models, sometimes outperforming even larger models such as GPT OSS 20B. We measured code comprehension abilities using the task of predicting inputs given outputs and vice-versa, Crux-IO. We find our models outperform comparable baselines. For multi-lingual code generation capabilities across programming languages we measure MultiPL-E on 6 languages (C++, TypeScript, Java, JavaScript, Shell, PHP) and we find performance close to the strongest model.
- **Agentic and Tool Use:** `rnj-1-instruct` dominates the pack on agentic coding, one of our target abilities. SWE-bench performance is indicative of the model’s ability to tackle everyday software engineering tasks. The model is an order of magnitude stronger than comparably sized models on SWE-bench and approaches the capabilities available in much larger models. It scores `20.8%` on SWE-bench Verified in bash-only mode, which is higher than Gemini 2.0 flash and Qwen2.5-Coder 32B Instruct under the same agentic framework ([leaderboard](https://www.swebench.com/bash-only.html)). There is a surge of interest in developing models’ abilities to write performant code. `rnj-1-instruct` is able to use a profiler to iteratively improve the performance of the code it writes. For instance, on [Enamel](https://github.com/q-rz/enamel/tree/main), which measures abilities to write efficient solutions to algorithmic problems, the model outperforms all other models under the same setting. Furthermore, `rnj-1-instruct` surpasses comparable models in tool use performance as measured by the Berkeley Functional Calling Leaderboard (BFCL).
- **Code Infilling** : Having specifically been trained on FIM-ed pre-training data, `rnj-1` exhibits strong infilling abilities, which have been further enhanced during post-training. The base model `rnj-1` scores highly on HE-FIM-Python (avg) at 82.49% and `rnj-1-instruct` achieves 86.21%.
- **Mathematical Problem Solving:** `rnj-1-instruct` shows strong mathematical abilities across several levels of difficulty from elementary math (GSM8k), high school and undergraduate math (Minerva-MATH), and competition math (AIME ‘24 and ‘25). On harder subjects, it outcompetes or is on par with the strongest model in the pack.
- **Scientific Reasoning:** `rnj-1-instruct` exhibits long-context reasoning abilities that are needed to solve hard science and technical questions in GPQA-Diamond and SuperGPQA.

### Reference

[rnj-1 blog post](https://www.essential.ai/research/rnj-1)
