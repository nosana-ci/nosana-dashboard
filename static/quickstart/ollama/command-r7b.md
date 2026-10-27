![r7b.jpg](https://ollama.com/assets/library/command-r7b/709a1bd1-3f55-4e90-b3ca-40db45e13683)

C4AI Command R7B is an open weights research release of a 7B billion parameter model with advanced capabilities optimized for a variety of use cases including reasoning, summarization, question answering, and code. The model is trained to perform sophisticated tasks including Retrieval Augmented Generation (RAG) and tool use. The model also has powerful agentic capabilities with the ability to use and combine multiple tools over multiple steps to accomplish more difficult tasks. It obtains top performance on enterprise relevant code use cases. C4AI Command R7B is a multilingual model trained on 23 languages.

### Model Details

**Model Architecture:** This is an auto-regressive language model that uses an optimized transformer architecture. After pretraining, this model uses supervised fine-tuning (SFT) and preference training to align model behavior to human preferences for helpfulness and safety. The model features three layers with sliding window attention (window size 4096) and ROPE for efficient local context modeling and relative positional encoding. A fourth layer uses global attention without positional embeddings, enabling unrestricted token interactions across the entire sequence.

**Languages covered:** The model has been trained on 23 languages: English, French, Spanish, Italian, German, Portuguese, Japanese, Korean, Arabic, Chinese, Russian, Polish, Turkish, Vietnamese, Dutch, Czech, Indonesian, Ukrainian, Romanian, Greek, Hindi, Hebrew, and Persian.
