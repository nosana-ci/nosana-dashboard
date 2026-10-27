# DeepScaleR

🚀 Democratizing Reinforcement Learning for LLMs 🌟

DeepScaleR-1.5B-Preview is a language model fine-tuned from DeepSeek-R1-Distilled-Qwen-1.5B using distributed reinforcement learning (RL) to scale up to long context lengths. The model achieves 43.1% Pass@1 accuracy on AIME 2024, representing a 15% improvement over the base model (28.8%) and surpassing OpenAI’s O1-Preview performance with just 1.5B parameters.

| Model | AIME 2024 | MATH 500 | AMC 2023 | Minerva Math | Olympiad Bench | Avg. |
| --- | --- | --- | --- | --- | --- | --- |
| **DeepScaleR-1.5B-Preview** | **43.1** | **87.8** | **73.6** | **30.2** | **50.0** | **57.0** |
| DeepSeek-R1-Distill-Qwen-1.5B | 28.8 | 82.8 | 62.9 | 26.5 | 43.3 | 48.9 |
| O1-Preview | 40.0 | 81.4 | - | - | - | - |

![image.png](https://ollama.com/assets/library/deepscaler/c8dcb4f4-481a-4fea-89a9-168cdd1f48fe)

### Data

Our training dataset consists of approximately 40,000 unique problem-answer pairs compiled from:

- AIME problems (1984-2023)
- AMC problems (prior to 2023)
- Omni-MATH dataset
- Still dataset

### Evaluation

We evaluate our model on competition-level mathematics benchmarks, including AIME 2024, AMC 2023, MATH-500, Minerva Math, and OlympiadBench. Below, Pass@1 accuracy is reported, averaged over 16 samples for each problem.

| **Model** | **AIME 2024** | **MATH 500** | **AMC 2023** | **Minerva Math** | **OlympiadBench** | **Avg.** |
| --- | --- | --- | --- | --- | --- | --- |
| Qwen-2.5-Math-7B-Instruct | 13.3 | 79.8 | 50.6 | 34.6 | 40.7 | 43.8 |
| rStar-Math-7B | 26.7 | 78.4 | 47.5 | - | 47.1 | - |
| Eurus-2-7B-PRIME | 26.7 | 79.2 | 57.8 | 38.6 | 42.1 | 48.9 |
| Qwen2.5-7B-SimpleRL | 26.7 | 82.4 | 62.5 | **39.7** | 43.3 | 50.9 |
| DeepSeek-R1-Distill-Qwen-1.5B | 28.8 | 82.8 | 62.9 | 26.5 | 43.3 | 48.9 |
| Still-1.5B | 32.5 | 84.4 | 66.7 | 29.0 | 45.4 | 51.6 |
| **DeepScaleR-1.5B-Preview** | **43.1** | **87.8** | **73.6** | 30.2 | **50.0** | **57.0** |
| O1-Preview | 40.0 | 81.4 | - | - | - | - |

We compare DeepScaleR with the base DeepSeek model we use, as well as recent academic works exploring RL for reasoning tasks. DeepScaleR significantly outperforms the base model across all benchmarks, achieving a 14.4% absolute gain on AIME2024 and an 8.1% overall improvement. Additionally, DeepScaleR surpasses recent academic works such as rSTAR, Prime, and SimpleRL, which are finetuned from 7B models. DeepScaleR achieves O1-preview-level performance with only 1.5B parameters—a remarkable efficiency gain.

![image.png](https://ollama.com/assets/library/deepscaler/afbe7f8e-04db-4350-ab39-352c023a6218)

## References

[Article](https://pretty-radio-b75.notion.site/DeepScaleR-Surpassing-O1-Preview-with-a-1-5B-Model-by-Scaling-RL-19681902c1468005bed8ca303013a4e2)

[GitHub](https://github.com/agentica-project/deepscaler)

[Hugging Face](https://huggingface.co/agentica-org/DeepScaleR-1.5B-Preview)
