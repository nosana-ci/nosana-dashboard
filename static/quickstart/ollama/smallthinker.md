![image.png](https://ollama.com/assets/library/smallthinker/1d25cb29-e27d-492c-be53-ce79b20def5b)

A new model fine-tuned from the Qwen2.5-3b-Instruct model.

SmallThinker is designed for the following use cases:

- Edge Deployment: Its small size makes it ideal for deployment on resource-constrained devices.
- Draft Model for QwQ-32B-Preview: SmallThinker can serve as a fast and efficient draft model for the larger QwQ-32B-Preview model, yielding a 70% speedup.

For achieving reasoning capabilities, it’s crucial to generate long chains of COT reasoning. Therefore, based on QWQ-32B-Preview, the authors used various synthetic techniques(such as personahub) to create the QWQ-LONGCOT-500K dataset. Compared to other similar datasets, over 75% of the author’s samples have output tokens exceeding 8K. To encourage research in the open-source community, the dataset was also made publicly available.

## References

[Hugging Face](https://huggingface.co/PowerInfer/SmallThinker-3B-Preview)
