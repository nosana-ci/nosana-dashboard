Note: this model requires Ollama 0.7.0. [Download Ollama](https://ollama.com/download)

![](https://ollama.com/assets/library/qwen2.5vl/7bd5aad3-d5c5-43b1-b915-1e85a378f1c4)

Qwen2.5-VL, the new flagship vision-language model of Qwen and also a significant leap from the previous Qwen2-VL.

The key features include:

- **Understand things visually:** Qwen2.5-VL is not only proficient in recognizing common objects such as flowers, birds, fish, and insects, but it is highly capable of analyzing texts, charts, icons, graphics, and layouts within images.
- **Being agentic:** Qwen2.5-VL directly plays as a visual agent that can reason and dynamically direct tools, which is capable of computer use and phone use.
- **Capable of visual localization in different formats:** Qwen2.5-VL can accurately localize objects in an image by generating bounding boxes or points, and it can provide stable JSON outputs for coordinates and attributes.
- **Generating structured outputs:** for data like scans of invoices, forms, tables, etc. Qwen2.5-VL supports structured outputs of their contents, benefiting usages in finance, commerce, etc.

## Performance

We evaluate our models with the SOTA models as well as the best models of similar model sizes. In terms of the flagship model Qwen2.5-VL-72B-Instruct, it achieves competitive performance in a series of benchmarks covering domains and tasks, including college-level problems, math, document understanding, general question answering, math, and visual agent. Notably, Qwen2.5-VL achieves significant advantages in understanding documents and diagrams, and it is capable of playing as a visual agent without task-specific fine tuning.

![image.png](https://ollama.com/assets/library/qwen2.5vl/440a5a81-c4e4-4b5e-aa3d-f75ab2ad04cc)

In terms of smaller models, Qwen2.5-VL-7B-Instruct outperforms GPT-4o-mini in a number of tasks, and Qwen2.5-VL-3B, which is a solution for edge AI, even outperforms the 7B model of our previous version Qwen2-VL.

![image.png](https://ollama.com/assets/library/qwen2.5vl/533ec184-7b82-4bcf-a4ab-af9a41ac0810)

![image.png](https://ollama.com/assets/library/qwen2.5vl/c90b8e4b-d023-4953-9cd5-e515324ca73c)

## References

[Blog](https://qwenlm.github.io/blog/qwen2.5-vl/)

[Qwen2.5-VL Technical Report](https://arxiv.org/abs/2502.13923)
