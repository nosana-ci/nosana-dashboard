![](https://ollama.com/assets/library/qwen2.5-coder/59b3c116-2653-4d50-9b5f-1fefd24a61bf)

Qwen 2.5 Coder series of models are now updated in 6 sizes: **0.5B, 1.5B, 3B, 7B, 14B and 32B**.

There are significant improvements in **code generation**, **code reasoning** and **code fixing**. The 32B model has competitive performance with OpenAI’s GPT-4o.

**32B:** `ollama run qwen2.5-coder:32b`

**14B:** `ollama run qwen2.5-coder:14b`

**7B:** `ollama run qwen2.5-coder:7b`

**3B:** `ollama run qwen2.5-coder:3b`

**1.5B:** `ollama run qwen2.5-coder:1.5b`

**0.5B:** `ollama run qwen2.5-coder:0.5b`

### Code capabilities reaching state of the art for open-source models

![Comparison benchmarks](https://ollama.com/assets/library/qwen2.5-coder/05059413-3cc4-4b07-b546-001594d0ae26)

**Code Generation:** Qwen2.5 Coder 32B Instruct, as the flagship model of this open-source release, has achieved the best performance among open-source models on multiple popular code generation benchmarks (EvalPlus, LiveCodeBench, BigCodeBench), and has competitive performance with GPT-4o.

**Code Repair:** Code repair is an important programming skill. Qwen2.5 Coder 32B Instruct can help users fix errors in their code, making programming more efficient. Aider is a popular benchmark for code repair, and Qwen2.5 Coder 32B Instruct scored 73.7, performing comparably to GPT-4o on Aider.

**Code Reasoning:** Code reasoning refers to the model’s ability to learn the process of code execution and accurately predict the model’s inputs and outputs. The recently released Qwen2.5 Coder 7B Instruct has already shown impressive performance in code reasoning, and this 32B model takes it a step further.

![Benchmarks](https://ollama.com/assets/library/qwen2.5-coder/0bd9e1aa-a87b-474b-84ba-264a85041605)

### Multiple programming languages

An intelligent programming assistant should be familiar with all programming languages. Qwen 2.5 Coder 32B performs excellent across more than 40 programming languages, scoring 65.9 on McEval, with impressive performances in languages like Haskell and Racket. The Qwen team used their own unique data cleaning and balancing during the pre-training phase.

![McEval Performance](https://ollama.com/assets/library/qwen2.5-coder/6436978b-1371-48a4-a21a-b6da729b74e1)

Additionally, the multi-language code repair capabilities of Qwen 2.5 Coder 32B Instruct remain impressive, aiding users in understanding and modifying programming languages they are familiar with, significantly reducing the learning cost of unfamiliar languages. Similar to McEval, MdEval is a multi-language code repair benchmark, where Qwen 2.5 Coder 32B Instruct scored 75.2, ranking first among all open-source models.

![MdEval Performance](https://ollama.com/assets/library/qwen2.5-coder/f2401bd6-f6d7-41ca-981d-98abc62f1493)

### Human Preference

To evaluate the alignment performance of Qwen 2.5 Coder 32B Instruct with human preferences, we constructed an internal annotated code preference evaluation benchmark called Code Arena (similar to Arena Hard). We used GPT-4o as the evaluation model for preference alignment, employing an ‘A vs. B win’ evaluation method, which measures the percentage of instances in the test set where model A’s score exceeds model B’s. The results below demonstrate the advantages of Qwen 2.5 Coder 32B Instruct in preference alignment.

![human preference](https://ollama.com/assets/library/qwen2.5-coder/bbf378d8-c80e-4ae3-98ab-90111dfbf3e7)

### Comprehensive model sizes to fit your device

![Model sizes](https://ollama.com/assets/library/qwen2.5-coder/752764ea-d510-4bc5-8658-dc5d8ba51019)

## References

[Blog Post](https://qwenlm.github.io/blog/qwen2.5-coder-family/)

[HuggingFace](https://huggingface.co/collections/Qwen/qwen25-coder-66eaa22e6f99801bf65b0c2f)
