![](https://ollama.com/assets/library/cogito/44ceefc5-6a71-4d18-958e-21d45d309b18)

The Cogito v1 Preview LLMs are instruction tuned generative models (text in/text out). All models are released under an open license for commercial use.

- Cogito models are hybrid reasoning models. Each model can answer directly (standard LLM), or self-reflect before answering (like reasoning models).
- The LLMs are trained using **Iterated Distillation and Amplification (IDA)** - an scalable and efficient alignment strategy for superintelligence using iterative self-improvement.
- The models have been optimized for coding, STEM, instruction following and general helpfulness, and have significantly higher multilingual, coding and tool calling capabilities than size equivalent counterparts. In both standard and reasoning modes, Cogito v1-preview models outperform their size equivalent counterparts on common industry benchmarks.

## Extended thinking

To enable extended thinking, include `Enable deep thinking subroutine.` in the system prompt:

```
/set system &#34;&#34;&#34;Enable deep thinking subroutine.&#34;&#34;&#34;
```

Or via the API:

```
curl http://localhost:11434/api/chat -d '{
  &#34;model&#34;: &#34;cogito&#34;,
  &#34;messages&#34;: [
    {
      &#34;role&#34;: &#34;system&#34;,
      &#34;content&#34;: &#34;Enable deep thinking subroutine.&#34;
    },
    {
      &#34;role&#34;: &#34;user&#34;,
      &#34;content&#34;: &#34;How many letter Rs are in the word Strawberry?&#34;
    }
  ]
}'
```

## Sizes

#### 3B

```
ollama run cogito:3b
```

#### 8B

```
ollama run cogito:8b
```

#### 14B

```
ollama run cogito:14b
```

#### 32B

```
ollama run cogito:32b
```

#### 70B

```
ollama run cogito:70b
```

## Benchmarks

### Smaller models - 3B and 8B

#### 3B performance

![3b.webp](https://ollama.com/assets/library/cogito/b3f444f7-91a6-4bd4-a395-a515060752b9)

#### 8B performance

![8b.webp](https://ollama.com/assets/library/cogito/e2cc899a-0f9f-48c5-a530-e941576bd67a)

#### 3B tool calling

![3b-toolcalling.webp](https://ollama.com/assets/library/cogito/53992b0e-9226-4fff-ba70-9ffd7f980f2f)

### Medium models - 14B and 32B

#### 14B

![14b.webp](https://ollama.com/assets/library/cogito/c32b8f91-3b00-457a-ad54-feab83d1decf)

#### 32B

![32b.webp](https://ollama.com/assets/library/cogito/bc5ea441-1fb8-4bf6-b4de-9093b0e74426)

### Larger models - 70B

![70b.webp](https://ollama.com/assets/library/cogito/139c3df7-bdc5-4497-aa51-cddb7eccaca9)

## References

[Blog post](https://www.deepcogito.com/research/cogito-v1-preview)

[Hugging Face](https://huggingface.co/collections/deepcogito/cogito-v1-preview-67eb105721081abe4ce2ee53)
