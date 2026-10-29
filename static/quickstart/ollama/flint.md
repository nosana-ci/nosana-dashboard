![Flint logo](https://ollama.com/assets/library/flint/dfd80fbb-5886-4bed-ad28-49350a681080)

Flint is Recursive’s open model for local coding agents. Give it a repository task—investigating a bug, implementing a feature, or writing tests—and it can reason through the work and use tools across multiple turns. It is built for development workflows that move from understanding code to making changes. [Learn more about Flint](https://huggingface.co/RecursiveSI/flint)

Flint has 39.8 billion total parameters, with approximately 2.5 billion active per token. Its 262K-token context provides room for substantial code and task history. Quantized versions are available for [Apple Silicon](https://huggingface.co/RecursiveSI/flint-int4) and [other GPUs](https://huggingface.co/RecursiveSI/flint-nvfp4-gguf) hardware, and the model is released under [Apache 2.0](https://huggingface.co/RecursiveSI/flint/blob/main/LICENSE).

## Coding benchmarks

In Recursive’s release evaluations, Flint scored **54.9% on Terminal-Bench 2.1**, **89.7% on SWE-bench Pro v2**, and **74.2% on SWE-bench Verified**. These are publisher-reported results; evaluation setups and runtimes can affect scores. [Source: Recursive’s evaluation](https://huggingface.co/RecursiveSI/flint#evaluation)

![](https://huggingface.co/RecursiveSI/flint/resolve/2a247be0c0aec895ccb0ac7ca92229ec6df37288/assets/flint_benchmarks_nvfp4.png)

*Recursive’s published BF16 and NVFP4 benchmark comparison.*

[Model details and evaluation methodology](https://huggingface.co/RecursiveSI/flint)
