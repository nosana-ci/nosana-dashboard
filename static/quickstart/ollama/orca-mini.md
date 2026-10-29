Orca Mini is a Llama and Llama 2 model trained on Orca Style datasets created using the approaches defined in the paper, Orca: Progressive Learning from Complex Explanation Traces of GPT-4. There are two variations available. The original Orca Mini based on Llama in 3, 7, and 13 billion parameter sizes, and v3 based on Llama 2 in 7, 13, and 70 billion parameter sizes.

## Usage

### CLI

Open the terminal and run `ollama run orca-mini`

### API

Example:

```
  curl -X POST http://localhost:11434/api/generate -d '{
    &#34;model&#34;: &#34;orca-mini&#34;,
    &#34;prompt&#34;:&#34;Why is the sky blue?&#34;
   }'
```

## Memory requirements

- 7b models generally require at least 8GB of RAM
- 13b models generally require at least 16GB of RAM
- 70b models generally require at least 64GB of RAM

## Reference

3b parameters original source: [Pankaj Mathur](https://huggingface.co/psmathur/orca_mini_3b)

7b parameters original source: [Pankaj Mathur](https://huggingface.co/psmathur/orca_mini_7b)

13b parameters original source: [Pankaj Mathur](https://huggingface.co/psmathur/orca_mini_13b)

**Orca Mini v3 source on Ollama**

13b parameters original source: [Pankaj Mathur](https://huggingface.co/psmathur/orca_mini_v3_13b)

70b parameters source: [Pankaj Mathur](https://huggingface.co/psmathur/orca_mini_v3_70b)

[Orca: Progressive Learning from Complex Explanation Traces of GPT-4](https://arxiv.org/abs/2306.02707)
