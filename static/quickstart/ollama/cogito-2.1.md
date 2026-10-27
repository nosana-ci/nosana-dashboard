![](https://ollama.com/assets/library/cogito/44ceefc5-6a71-4d18-958e-21d45d309b18)

cogito-2.1 models require [Ollama v0.13.0](https://github.com/ollama/ollama/releases) or later.

The Cogito v2.1 LLMs are instruction tuned generative models. All models are released under MIT license for commercial use.

- The best open-weight LLM by a US company: Cogito v2.1 671B
- On most industry benchmarks and our internal evals, the model performs competitively to frontier closed and open models, while being ahead of any other US open model.
- This model uses significantly fewer tokens amongst any similar capability models, because it has better reasoning capabilities. It also has improvements across instruction following, coding, longer queries, multi-turn and creativity.
- This model is trained in over 30 languages and supports a context length of 128k.

### Models

**671B**

```
ollama run cogito-2.1
```

**Ollama’s cloud**

```
ollama run cogito-2.1:671b-cloud
```

### Evaluation

**Note from Cogito:**

While these benchmarks provide a useful signal, they do not fully capture real-world performance. That said, our models have been tested across multiple internal and external evaluations and consistently perform well.

Ultimately, the best evals are the ones closest to the user’s needs.

We are confident that our models will stand up to such real-world evaluations and deliver strong results in practice. ![benchmark1](https://ollama.com/assets/library/cogito-2.1/f2be7eb9-2f2d-43e3-b9eb-3ce07238389b)

![benchmark2](https://ollama.com/assets/library/cogito-2.1/8a4bed5c-2cb5-4b5a-8814-e5093676e476)

Cogito v2.1 model has the lowest average tokens3 used with respect to reasoning models of similar capabilities.

![avgtokenusage](https://ollama.com/assets/library/cogito-2.1/1e393452-5c47-4e82-a225-166bc0bf3629)
