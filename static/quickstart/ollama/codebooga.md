![](https://github.com/jmorganca/ollama/assets/251292/700d0dcf-3bc0-406f-b289-e48965e8f602)

Codebooga was created by merging two existing models:

1. [Phind-CodeLlama-34B-v2](https://ollama.ai/library/phind-codellama)
2. [WizardCoder-Python-34B-V1.0](https://ollama.ai/library/wizardcoder)

It was created by using the [BlockMerge Gradient](https://github.com/Gryphe/BlockMerge_Gradient) script.

### Example prompts

```
Write the javascript react code to render a sign up form
```

```
Where is the bug in this code?

def fib(n):
    if n <= 0:
        return n
    else:
        return fib(n-1) + fib(n-2)
```

### Recommended parameters

```
temperature: 1.31
top_p: 0.14
repeat_penalty: 1.17
top_k: 49
```

## References

[Hugging Face](https://huggingface.co/oobabooga/CodeBooga-34B-v0.1)
