![](https://ollama.com/assets/library/marco-o1/93bea833-d0c0-48b6-8ece-9c2de26cba27)

- **Fine-Tuning with CoT Data:** We develop Marco-o1-CoT by performing full-parameter fine-tuning on the base model using open-source CoT dataset combined with our self-developed synthetic data.
- **Solution Space Expansion via MCTS:** We integrate LLMs with MCTS (Marco-o1-MCTS), using the model’s output confidence to guide the search and expand the solution space.
- **Reasoning Action Strategy:** We implement novel reasoning action strategies and a reflection mechanism (Marco-o1-MCTS mini-step), including exploring different action granularities within the MCTS framework and prompting the model to self-reflect, thereby significantly enhancing the model’s ability to solve complex problems.
- **Application in Translation Tasks:** We are the first to apply Large Reasoning Models (LRM) to Machine Translation task, exploring inference time scaling laws in the multilingual and translation domain.

## Usage

```
ollama run marco-o1 &#34;How many Rs are in strawberry?&#34;
```

Parse the resulting string between `<Output>` and `</Output>`:

```
...
<Output>
There are 3 Rs in strawberry.
</Output>
```

## References

[GitHub](https://github.com/AIDC-AI/Marco-o1?tab=readme-ov-file)

[HuggingFace](https://huggingface.co/AIDC-AI/Marco-o1)
