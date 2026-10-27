![](https://github.com/jmorganca/ollama/assets/251292/e06e1a36-97b2-417a-b2b2-028c980359b1)

Phi-2 is a small language model capable of common-sense reasoning and language understanding. It showcases “state-of-the-art performance” among language models with less than 13 billion parameters.

### Example prompt

By default, `phi` includes a chat prompt template designed for multi-turn conversations:

```
% ollama run phi
>>> Hello, can you help me find my way to Toronto?
 Certainly! What is the exact location in Toronto that you are looking for?

>>> Yonge & Bloor
 Sure, Yonge and Bloor is a busy intersection in downtown Toronto. Would you like to take public transportation or drive there?

>>> Public transportation
 Great! The easiest way to get there is by taking the TTC subway. You can take Line 1, which runs along Yonge Street and passes through downtown Toronto.
```

Using Ollama’s API:

```
curl http://localhost:11434/api/chat -d '{
  &#34;model&#34;: &#34;phi&#34;,
  &#34;messages&#34;: [
    { &#34;role&#34;: &#34;user&#34;, &#34;content&#34;: &#34;why is the sky blue?&#34; }
  ]
}'
```

### Example prompts (raw mode)

Phi also responds well to a wide variety of prompt formats when using [raw mode](https://github.com/jmorganca/ollama/blob/main/docs/api.md#request-raw-mode) in Ollama’s API, which bypasses all default prompt templating:

#### Instruct

```
curl http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;phi&#34;,
  &#34;prompt&#34;: &#34;Instruct: Write a detailed analogy between mathematics and a lighthouse.\nOutput:&#34;,
  &#34;options&#34;: {
    &#34;stop&#34;: [&#34;Instruct:&#34;, &#34;Output:&#34;]
  },
  &#34;raw&#34;: true,
  &#34;stream&#34;: false
}'
```

#### Code Completion

```
curl http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;phi&#34;,
  &#34;prompt&#34;: &#34;def print_prime(n):\n  &#34;,
  &#34;raw&#34;: true,
  &#34;stream&#34;: false
}'
```

#### Text completion

```
curl http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;phi&#34;,
  &#34;prompt&#34;: &#34;There once was a mouse named&#34;,
  &#34;raw&#34;: true,
  &#34;stream&#34;: false
}'
```

## References

[HuggingFace](https://huggingface.co/microsoft/phi-2)

[Blog Post](https://www.microsoft.com/en-us/research/blog/phi-2-the-surprising-power-of-small-language-models/)
