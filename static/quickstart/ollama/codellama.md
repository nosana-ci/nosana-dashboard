![](https://github.com/jmorganca/ollama/assets/3325447/286e4e13-0b2b-43a4-9b07-23a50d3a3d33)

Code Llama is a model for generating and discussing code, built on top of [Llama 2](https://ollama.ai/library/llama2). It’s designed to make workflows faster and efficient for developers and make it easier for people to learn how to code. It can generate both code and natural language about code. Code Llama supports many of the most popular programming languages used today, including Python, C++, Java, PHP, Typescript (Javascript), C#, Bash and more.

## Parameter counts

| Parameter Count |  |  |
| --- | --- | --- |
| 7 billion | [View](https://ollama.com/library/codellama:7b) | `ollama run codellama:7b` |
| 13 billion | [View](https://ollama.com/library/codellama:13b) | `ollama run codellama:13b` |
| 34 billion | [View](https://ollama.com/library/codellama:34b) | `ollama run codellama:34b` |
| 70 billion | [View](https://ollama.com/library/codellama:70b) | `ollama run codellama:70b` |

## Usage

### CLI

```
ollama run codellama &#34;Write me a function that outputs the fibonacci sequence&#34;
```

### API

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;codellama&#34;,
  &#34;prompt&#34;: &#34;Write me a function that outputs the fibonacci sequence&#34;
}'
```

## Variations

|  |  |
| --- | --- |
| `instruct` | Fine-tuned to generate helpful and safe answers in natural language |
| `python` | A specialized variation of Code Llama further fine-tuned on 100B tokens of Python code |
| `code` | Base model for code completion |

## Example prompts

### Ask questions

```
ollama run codellama:7b-instruct 'You are an expert programmer that writes simple, concise code and explanations. Write a python function to generate the nth fibonacci number.'
```

### Fill-in-the-middle (FIM) or infill

```
ollama run codellama:7b-code '<PRE> def compute_gcd(x, y): <SUF>return result <MID>'
```

Fill-in-the-middle (FIM) is a special prompt format supported by the code completion model can complete code between two already written code blocks. Code Llama expects a specific format for infilling code:

```
<PRE> {prefix} <SUF>{suffix} <MID>
```

`<PRE>`, `<SUF>` and `<MID>` are special tokens that guide the model.

### Code review

```
ollama run codellama '
Where is the bug in this code?

def fib(n):
    if n <= 0:
        return n
    else:
        return fib(n-1) + fib(n-2)
'
```

### Writing tests

```
ollama run codellama &#34;write a unit test for this function: $(cat example.py)&#34;
```

### Code completion

```
ollama run codellama:7b-code '# A simple python function to remove whitespace from a string:'
```

## More information

- [How to prompt Code Llama](https://ollama.ai/blog/how-to-prompt-code-llama)
- [Whitepaper](https://arxiv.org/abs/2308.12950)
- [CodeLlama GitHub](https://github.com/facebookresearch/codellama)
- [Hugging Face](https://huggingface.co/codellama)
