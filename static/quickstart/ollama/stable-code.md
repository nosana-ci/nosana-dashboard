Stable Code 3B is a 3 billion parameter Large Language Model (LLM), allowing accurate and responsive code completion at a level on par with models such as Code Llama 7b that are 2.5x larger.

**Key Features**

- **NEW** instruct model `ollama run stable-code`
- Fill in Middle Capability (FIM)
- Supports Long Context, trained with Sequences upto 16,384

![spiderchart](https://github.com/jmorganca/ollama/assets/3325447/6c3de7a5-5e10-4884-81fb-3a1b3f566609)

| Model | Size | Python | C++ | Javascript | Java | PHP | Rust |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Stable Code** | 3B | 32.4% | 30.9% | 32.1% | 32.1% | 24.2% | 23.0% |
| CodeLLama | 7B | 30.0% | 28.2% | 32.5% | 31.1% | 25.7% | 26.3% |
| Deepseek Coder | 1.3B | 28.6% | 29.2% | 28.7% | 29.0% | 23.6% | 18.5% |
| Wizard Coder | 3B | 31.6% | 25.6% | 26.2% | 25.8% | 25.3% | 20.4% |
| StarCoder | 3B | 21.6% | 19.8% | 21.5% | 20.5% | 19.0% | 16.9% |
| Replit Code V1.5 | 3B | 23.0% | 25.9% | 26.2% | 23.6% | 23.2% | 21.5% |
| Deci Coder | 1B | 19.1% | 6.8% | 18.4% | 16.7% | 2.1% | 1.7% |

## Model Details

- **Developed by**: [Stability AI](https://stability.ai/)
- **Model type**: stable-code models are auto-regressive language models based on the transformer decoder architecture.
- **Language(s)**: English, Code
- **Contact**: For questions and comments about the model, please email `lm@stability.ai`

### Model Architecture

The model is a decoder-only transformer similar to the LLaMA ([Touvron et al., 2023](https://arxiv.org/abs/2307.09288)) architecture with the following modifications:

| Parameters | Hidden Size | Layers | Heads | Sequence Length |
| --- | --- | --- | --- | --- |
| 2,796,431,360 | 2560 | 32 | 32 | 16384 |

- **Position Embeddings**: Rotary Position Embeddings ([Su et al., 2021](https://arxiv.org/abs/2104.09864)) applied to the first 25% of head embedding dimensions for improved throughput following [Black et al. (2022)](https://arxiv.org/pdf/2204.06745.pdf).
- **Tokenizer**: We use a modified version of the GPTNeoX Tokenizer.[`NeoX`](https://github.com/EleutherAI/gpt-neox). We add special tokens to train for Fill in the Middle (FIM) capabilities like `<FIM_PREFIX>` and `<FIM_SUFFIX>` along with other special tokens.

## Training

### Training Dataset

The dataset is comprised of a filtered mixture of open-source large-scale datasets available on the [HuggingFace Hub](https://huggingface.co/datasets): Falcon RefinedWeb extract ([Penedo et al., 2023](https://huggingface.co/datasets/tiiuae/falcon-refinedweb)), along with [CommitPackFT](https://huggingface.co/datasets/bigcode/commitpackft) and [Github Issues](https://huggingface.co/datasets/bigcode/the-stack-github-issues) (BigCode., 2023), and StarCoder ([Li et al., 2023](https://arxiv.org/abs/2305.06161)). We further supplement our training with data from mathematical domains ([Azerbayev, Zhangir, et al., 2023](https://arxiv.org/abs/2310.10631) and, [Yu, Longhui, et al., 2023](https://arxiv.org/abs/2309.12284)).

Top 18 programming languages trained on: - C - CPP - Java - JavaScript - CSS - Go - HTML - Ruby - Rust - Markdown - Shell - Php - Sql - R - Typescript - Python - Jupyter-Clean - RestructuredText

## Use and Limitations

### Intended Use

The model is intended to be used as a foundational base model for application-specific fine-tuning. Developers must evaluate and fine-tune the model for safe performance in downstream applications.

### Limitations and Bias

​ As a base model, this model may exhibit unreliable, unsafe, or other undesirable behaviors that must be corrected through evaluation and fine-tuning prior to deployment. The pre-training dataset may have contained offensive or inappropriate content, even after applying data cleansing filters, which can be reflected in the model-generated text. We recommend that users exercise caution when using these models in production systems. Do not use the models if they are unsuitable for your application, or for any applications that may cause deliberate or unintentional harm to others.

## References

[Hugging Face](https://huggingface.co/stabilityai/stable-code-3b)
