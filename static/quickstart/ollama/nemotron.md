![](https://ollama.com/assets/library/nemotron-mini/4e0ea563-a507-45e7-ad0b-b083918ec11b)

Llama-3.1-Nemotron-70B-Instruct is a large language model customized by NVIDIA to improve the helpfulness of LLM generated responses to user queries.

This model was trained using RLHF (specifically, REINFORCE), [Llama-3.1-Nemotron-70B-Reward](https://huggingface.co/nvidia/Llama-3.1-Nemotron-70B-Reward) and [HelpSteer2-Preference prompts](https://huggingface.co/datasets/nvidia/HelpSteer2) on a [Llama-3.1-70B-Instruct](https://ai.meta.com/blog/meta-llama-3-1/) model as the initial policy.

```
$ ollama run nemotron
>>> How many r in strawberry?
A sweet question!

Let's count the &#34;R&#34;s in &#34;strawberry&#34;:

1. S
2. T
3. R
4. A
5. W
6. B
7. E
8. R
9. R
10. Y

There are **3** &#34;R&#34;s in the word &#34;strawberry&#34;.
```

## Reference

[Hugging Face](https://huggingface.co/nvidia/Llama-3.1-Nemotron-70B-Instruct-HF)
