### Get started

**20B:**

```
ollama run gpt-oss-safeguard:20b
```

This model is designed to fit into GPUs with 16GB of VRAM. (21B parameters with 3.6B active parameters).

**120B:**

```
ollama run gpt-oss-safeguard:120b
```

This model is designed to fit into a single NVIDIA H100 GPU (117B parameters with 5.1B active parameters).

### Highlights

- **Trained to reason about safety** : Trained and tuned for safety reasoning to accommodate use cases like LLM input-output filtering, online content labeling and offline labeling for Trust and Safety use cases.
- **Bring your own policy:** Interprets your written policy, so it generalizes across products and use cases with minimal engineering.
- **Reasoned decisions, not just scores:** Gain complete access to the model’s reasoning process, facilitating easier debugging and increased trust in policy decisions. Keep in mind Raw CoT is meant for developers and safety practitioners. It’s not intended for exposure to general users or use cases outside of safety contexts.
- **Configurable reasoning effort:** Easily adjust the reasoning effort (low, medium, high) based on your specific use case and latency needs.
- **Permissive Apache 2.0 license:** Build freely without copyleft restrictions or patent risk—ideal for experimentation, customization, and commercial deployment.

### Join the ROOST Model Community

gpt-oss-safeguard is a model partner of the [Robust Open Online Safety Tools (ROOST)](http://roost.tools/) Model Community. The ROOST Model Community (RMC) is a group of safety practitioners exploring open source AI models to protect online spaces. As an RMC model partner, OpenAI is committed to incorporating user feedback and jointly iterating on future releases in pursuit of open safety. Visit the [RMC GitHub repo](https://github.com/roostorg/open-models) to learn more about this partnership and how to get involved.

### References

- [OpenAI blog](https://openai.com/index/introducing-gpt-oss-safeguard/)
- OpenAI [gpt-oss-safeguard developer cookbook](https://cookbook.openai.com/articles/gpt-oss-safeguard-guide)
- ROOST’s [model community repository](https://github.com/roostorg/open-models) on GitHub
