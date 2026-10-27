![image.png](https://ollama.com/assets/library/embeddinggemma/9a20d963-4bf1-4177-9568-ca5d53a2d14e)

This model requires [Ollama v0.11.10](https://github.com/ollama/ollama/releases/tag/v0.11.10) or later

**EmbeddingGemma** is a 300M parameter, state-of-the-art for its size, open embedding model from Google, built from Gemma 3 (with T5Gemma initialization) and the same research and technology used to create Gemini models. EmbeddingGemma produces vector representations of text, making it well-suited for search and retrieval tasks, including classification, clustering, and semantic similarity search. This model was trained with data in 100+ spoken languages.

The small size and on-device focus makes it possible to deploy in environments with limited resources such as mobile phones, laptops, or desktops, democratizing access to state of the art AI models and helping foster innovation for everyone.

### Benchmark

![image.png](https://ollama.com/assets/library/embeddinggemma/59a205f6-1711-4db4-8026-96d23fa2c9da)

#### Training Dataset

This model was trained on a dataset of text data that includes a wide variety of sources totaling approximately 320 billion tokens. Here are the key components:

- **Web Documents**: A diverse collection of web text ensures the model is exposed to a broad range of linguistic styles, topics, and vocabulary. The training dataset includes content in over 100 languages.
- **Code and Technical Documents**: Exposing the model to code and technical documentation helps it learn the structure and patterns of programming languages and specialized scientific content, which improves its understanding of code and technical questions.
- **Synthetic and Task-Specific Data**: Synthetically training data helps to teach the model specific skills. This includes curated data for tasks like information retrieval, classification, and sentiment analysis, which helps to fine-tune its performance for common embedding applications.

The combination of these diverse data sources is crucial for training a powerful multilingual embedding model that can handle a wide variety of different tasks and data formats.

### Reference

[Documentation](https://ai.google.dev/gemma/docs/embeddinggemma)
