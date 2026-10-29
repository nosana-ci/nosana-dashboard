![](https://ollama.com/assets/library/deepseek-v3/069ccc94-63b0-41e6-b2b3-e8e56068ab1a)

DeepSeek-OCR requires [Ollama v0.13.0](https://github.com/ollama/ollama/releases) or later.

DeepSeek-OCR is a vision-language model that can perform token-efficient optical character recognition (OCR).

![fig1.png](https://ollama.com/assets/library/deepseek-ocr/e93c9353-3836-4680-a7f1-148ad3e47eff)

### Example inputs

Please note, the model is sensitive to its input. For example, a missing punctuation or new line may cause an improper output.

```
ollama run deepseek-ocr &#34;/path/to/image\n<|grounding|>Given the layout of the image.&#34;
```

```
ollama run deepseek-ocr &#34;/path/to/image\nFree OCR.&#34;
```

```
ollama run deepseek-ocr &#34;/path/to/image\nParse the figure.&#34;
```

```
ollama run deepseek-ocr &#34;/path/to/image\nExtract the text in the image.&#34;
```

```
ollama run deepseek-ocr &#34;/path/to/image\n<|grounding|>Convert the document to markdown.&#34;
```

### Examples

![show1.jpg](https://ollama.com/assets/library/deepseek-ocr/445a87aa-b34e-4a85-8aba-921dd54cfd86)

![show2.jpg](https://ollama.com/assets/library/deepseek-ocr/78c11fd6-d1be-4983-a08a-5188c65fcd1f)

![show3.jpg](https://ollama.com/assets/library/deepseek-ocr/44b2ac4a-d52e-4f77-843d-3c828e7ecaf0)

![show4.jpg](https://ollama.com/assets/library/deepseek-ocr/39e4d41b-634e-407a-a26e-7880c0a2b137)

### References

- [Arxiv paper](https://arxiv.org/abs/2510.18234)
