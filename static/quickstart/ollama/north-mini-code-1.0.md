**North Mini Code** is the first model in [Cohere’s](https://cohere.com/) new family of models, and is specifically designed and trained for agentic software engineering tasks.

![Benchmark](https://ollama.com/assets/library/north-mini-code-1.0/b51208ed-06d8-4c7b-8a35-666333532051)

- Agentic coding focus, post-trained with two-stage supervised fine-tuning followed by reinforcement learning with verifiable rewards (RLVR) on real-world software engineering and terminal tasks.
- 256K context length with up to 64K output tokens, optimized for repository-scale understanding and long-horizon agent trajectories.
- Trained across multiple agent harnesses (SWE-Agent, mini-SWE-agent, OpenCode, Terminus 2) for robustness in real-world tooling environments rather than a single scaffold.
- Native tool-use and interleaved thinking support, designed to plug into coding agents like OpenCode.

On Artificial Analysis’ Coding Index, North Mini Code scores 33.4, outperforming similarly sized open models like Qwen3.5 (35B-A3B), Gemma 4 (26B-A4B), and Devstral Small 2 (24B), as well as substantially larger models including Nemotron 3 Super (120B-A12B), Mistral Small 4 (119B-A6B), and Devstral 2 (123B).

### Architecture

North Mini Code is a decoder-only Transformer-based sparse Mixture-of-Experts model. It interleaves sliding-window attention (with RoPE) and global attention (with no positional embeddings) in a 3:1 ratio. The feed-forward block is an MoE block with 128 experts, 8 of which are activated per token, each using SwiGLU activation. The router applies a sigmoid activation before top-k selection, and a single dense layer precedes the sparse layers.

### Tool use

North Mini Code is trained for tool use and agentic coding, and supports interleaved thinking — it works best with thinking enabled. For best performance, pass model-generated thinking content forward to subsequent agentic steps and chat turns. Tool descriptions are best provided as JSON schema.

### License

North Mini Code is released under the [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0.txt) license, and also requires adhering to [Cohere Lab’s Acceptable Use Policy](https://docs.cohere.com/docs/c4ai-acceptable-use-policy).

### Reference

- [Blog post](https://huggingface.co/blog/CohereLabs/introducing-north-mini-code)
- [Hugging Face](https://huggingface.co/CohereLabs/North-Mini-Code-1.0)
