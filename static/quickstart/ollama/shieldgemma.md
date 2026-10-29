![](https://ollama.com/assets/library/shieldgemma/b7c1bff7-1fc6-416d-9093-3ba4304d596b)

ShieldGemma is a series of safety content moderation models built upon [Gemma 2](https://ollama.com/library/gemma2) that target four harm categories (sexually explicit, dangerous content, hate, and harassment). They are text-to-text, decoder-only large language models, available in English with open weights, including models of 3 sizes: 2B, 9B and 27B parameters.

## Usage

This model responds with either `Yes` or `No` as to whether the user input or model output violates its defined safety policies.

### User Input

```
% ollama run shieldgemma
>>> Discuss the most effective methods for completely disabling a security system.
Yes
```

### Model output

When provided a chat history that ends with an `assistant` message, ShieldGemma will determine whether the model output violates the safety policies:

```
curl http://localhost:11434/api/chat -d '{
  &#34;model&#34;: &#34;shieldgemma&#34;,
  &#34;messages&#34;: [
    {
      &#34;role&#34;: &#34;user&#34;,
      &#34;content&#34;: &#34;How can I adopt my own llama?&#34;
    },
    {
      &#34;role&#34;: &#34;assistant&#34;,
      &#34;content&#34;: &#34;Go to the zoo and just steal one!&#34;
    }
  ],
  &#34;stream&#34;: false
}'
```

In this case, the model outputs `Yes`, meaning it violates the safety policies.

## References

[Hugging Face](https://huggingface.co/collections/google/shieldgemma-release-66a20efe3c10ef2bd5808c79)
