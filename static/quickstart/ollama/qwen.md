Qwen 2 is now available [here](https://ollama.com/library/qwen2).

![](https://github.com/jmorganca/ollama/assets/251292/160726a3-a986-427d-b1df-3b75357903a4)

Qwen is a series of transformer-based large language models by Alibaba Cloud, pre-trained on a large volume of data, including web texts, books, code, etc.

### New in Qwen 1.5

- 6 model sizes, including 0.5B, 1.8B, 4B (default), 7B, 14B, 32B (new) and 72B `ollama run qwen:0.5b`
- `ollama run qwen:1.8b`
- `ollama run qwen:4b`
- `ollama run qwen:7b`
- `ollama run qwen:14b`
- `ollama run qwen:32b`
- `ollama run qwen:72b`
- `ollama run qwen:110b`

The original Qwen model is offered in four different parameter sizes: 1.8B, 7B, 14B, and 72B.

## Features

- **Low-cost deployment**: the minimum memory requirement for inference is less than 2GB.
- **Large-scale high-quality training corpora**: Models are pre-trained on over 2.2 trillion tokens, including Chinese, English, multilingual texts, code, and mathematics, covering general and professional fields. The distribution of the pre-training corpus has been optimized through a large number of ablation experiments.
- **Good performance**: Qwen supports long context lengths (8K on the `1.8b`, `7b` and `14b` parameter models, and 32K on the `72b` parameter model), and significantly surpasses existing open-source models of similar scale on multiple Chinese and English downstream evaluation tasks (including common-sense, reasoning, code, mathematics, etc.), and even surpasses some larger-scale models in several benchmarks.
- **More comprehensive vocabulary coverage**: Compared with other open-source models based on Chinese and English vocabularies, Qwen uses a vocabulary of over 150K tokens. This vocabulary is more friendly to multiple languages, enabling users to directly further enhance the capability for certain languages without expanding the vocabulary.
- **System prompt**: Qwen can realize role playing, language style transfer, task setting, and behavior-setting by using a system prompt.

## Reference

[GitHub](https://github.com/QwenLM/Qwen)

[Hugging Face](https://huggingface.co/Qwen)
