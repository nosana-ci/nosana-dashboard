![](https://ollama.com/assets/library/opencoder/6078034f-fdbf-47c2-9b63-69ce506c0225)

**OpenCoder** is an open and reproducible code LLM family which includes 1.5B and 8B models, supporting both English and Chinese languages. Starting from scratch, OpenCoder is pretrained on 2.5 trillion tokens composed of 90% raw code and 10% code-related web data, and supervised finetuned on over 4.5M high-quality SFT examples, finally reaching the performance of top-tier code LLMs. We provide not only model weights and inference code, but also the reproducible training data, the complete data processing pipeline, rigorous experimental ablation results, and detailed training protocols. Empowering researchers to build and innovate, OpenCoder is your open foundation for advancing code AI.

- **Complete Open Source**: OpenCoder ensures full transparency by releasing not only the model weights and forthcoming inference code but also the complete data-cleaning code for training. This release includes high-quality synthetic data, an extensive set of checkpoints, and a dataset of over 4.5 million supervised fine-tuning (SFT) entries, making OpenCoder one of the most comprehensively open-sourced models available.
- **Comprehensive Experimental Analysis**: OpenCoder is rigorously tested through extensive ablation studies on various data-cleaning strategies and training processes, including file-level and repository-level deduplication experiments, ensuring thorough exploration and validation of the model’s performance.
- **High-Quality Synthetic Data**: OpenCoder provides a fully developed synthetic data generation process and over 4.5 million SFT data entries, establishing a robust data foundation for model training and evaluation.
- **Exceptional Performance**: OpenCoder achieves high performance across multiple language model benchmarks, positioning it among the leading open-source models for code.

## References

[GitHub](https://github.com/OpenCoder-llm/OpenCoder-llm)

[Paper](https://arxiv.org/pdf/2411.04905)

[Hugging Face](https://huggingface.co/collections/infly/opencoder-672cec44bbb86c39910fb55e)
