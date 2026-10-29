![Hero-Image.webp](https://ollama.com/assets/library/command-a/5849b9b2-34cd-4827-92d4-97613dc8a5e5)

Command A is an open weights research release of a 111 billion parameter model optimized for demanding enterprises that require fast, secure, and high-quality AI. Compared to other leading proprietary and open-weights models Command A delivers maximum performance with minimum hardware costs, excelling on business-critical agentic and multilingual tasks while‬ being deployable on just two GPUs.

**Languages covered:** The model has been trained on 23 languages: English, French, Spanish, Italian, German, Portuguese, Japanese, Korean, Arabic, Chinese, Russian, Polish, Turkish, Vietnamese, Dutch, Czech, Indonesian, Ukrainian, Romanian, Greek, Hindi, Hebrew, and Persian.

**Context Window:** Up to 256K.

### Use cases

Command A is designed with the following capabilities.

#### Chat

By default, Command A is configured as a conversational model. A preamble conditions the model on interactive behaviour, meaning it is expected to reply in a conversational fashion, provides introductory statements and follow-up questions, and uses Markdown as well as LaTeX where appropriate. This is desired for interactive experiences, such as chatbots, where the model engages in dialogue.

#### Retrieval augmented generation (RAG)

Command A has been trained specifically for tasks like the final step of Retrieval Augmented Generation (RAG).

#### Tool Support

Command A has been specifically trained with conversational tool use capabilities. This allows the model to interact with external tools like APIs, databases, or search engines.

#### Code

Command A has meaningfully improved on code capabilities. In addition to academic code benchmarks, we have evaluated it on enterprise-relevant scenarios, including SQL generation and code translation, where it outperforms other models of similar size. Try these out by requesting code snippets, code explanations, or code rewrites. For better performance, we also recommend using a low temperature (and even greedy decoding) for code-generation related instructions.
