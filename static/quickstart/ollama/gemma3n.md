![](https://ollama.com/assets/library/gemma3n/440e8da2-ddf4-482f-a341-4eeb3c08a332)

Gemma 3n models are designed for efficient execution on everyday devices such as laptops, tablets or phones. These models were trained with data in over 140 spoken languages.

Gemma 3n models use selective parameter activation technology to reduce resource requirements. This technique allows the models to operate at an effective size of 2B and 4B parameters, which is lower than the total number of parameters they contain.

## Models

### Effective 2B

```
ollama run gemma3n:e2b
```

### Effective 4B

```
ollama run gemma3n:e4b
```

## Evaluation

Model evaluation metrics and results.

### Benchmark Results

These models were evaluated at full precision (float32) against a large collection of different datasets and metrics to cover different aspects of content generation. Evaluation results marked with **IT** are for instruction-tuned models. Evaluation results marked with **PT** are for pre-trained models. The models available on Ollama are instruction-tuned models.

![lm arena](https://ollama.com/assets/library/gemma3n/b131b187-c935-4310-931b-439ce30533fd)

#### Reasoning and factuality

| Benchmark | Metric | n-shot | E2B PT | E4B PT |
| --- | --- | --- | --- | --- |
| [HellaSwag](https://arxiv.org/abs/1905.07830) | Accuracy | 10-shot | 72.2 | 78.6 |
| [BoolQ](https://arxiv.org/abs/1905.10044) | Accuracy | 0-shot | 76.4 | 81.6 |
| [PIQA](https://arxiv.org/abs/1911.11641) | Accuracy | 0-shot | 78.9 | 81.0 |
| [SocialIQA](https://arxiv.org/abs/1904.09728) | Accuracy | 0-shot | 48.8 | 50.0 |
| [TriviaQA](https://arxiv.org/abs/1705.03551) | Accuracy | 5-shot | 60.8 | 70.2 |
| [Natural Questions](https://github.com/google-research-datasets/natural-questions) | Accuracy | 5-shot | 15.5 | 20.9 |
| [ARC-c](https://arxiv.org/abs/1911.01547) | Accuracy | 25-shot | 51.7 | 61.6 |
| [ARC-e](https://arxiv.org/abs/1911.01547) | Accuracy | 0-shot | 75.8 | 81.6 |
| [WinoGrande](https://arxiv.org/abs/1907.10641) | Accuracy | 5-shot | 66.8 | 71.7 |
| [BIG-Bench Hard](https://paperswithcode.com/dataset/bbh) | Accuracy | few-shot | 44.3 | 52.9 |
| [DROP](https://arxiv.org/abs/1903.00161) | Token F1 score | 1-shot | 53.9 | 60.8 |

#### Multilingual

| Benchmark | Metric | n-shot | E2B IT | E4B IT |
| --- | --- | --- | --- | --- |
| [MGSM](https://arxiv.org/abs/2210.03057) | Accuracy | 0-shot | 53.1 | 60.7 |
| [WMT24++](https://arxiv.org/abs/2502.12404v1) (ChrF) | Character-level F-score | 0-shot | 42.7 | 50.1 |
| [Include](https://arxiv.org/abs/2411.19799) | Accuracy | 0-shot | 38.6 | 57.2 |
| [MMLU](https://arxiv.org/abs/2009.03300) (ProX) | Accuracy | 0-shot | 8.1 | 19.9 |
| [OpenAI MMLU](https://huggingface.co/datasets/openai/MMMLU) | Accuracy | 0-shot | 22.3 | 35.6 |
| [Global-MMLU](https://huggingface.co/datasets/CohereLabs/Global-MMLU) | Accuracy | 0-shot | 55.1 | 60.3 |
| [ECLeKTic](https://arxiv.org/abs/2502.21228) | ECLeKTic score | 0-shot | 2.5 | 1.9 |

#### STEM and code

| Benchmark | Metric | n-shot | E2B IT | E4B IT |
| --- | --- | --- | --- | --- |
| [GPQA](https://arxiv.org/abs/2311.12022) Diamond | RelaxedAccuracy/accuracy | 0-shot | 24.8 | 23.7 |
| [LiveCodeBench](https://arxiv.org/abs/2403.07974) v5 | pass@1 | 0-shot | 18.6 | 25.7 |
| Codegolf v2.2 | pass@1 | 0-shot | 11.0 | 16.8 |
| [AIME 2025](https://www.vals.ai/benchmarks/aime-2025-05-09) | Accuracy | 0-shot | 6.7 | 11.6 |

#### Additional benchmarks

| Benchmark | Metric | n-shot | E2B IT | E4B IT |
| --- | --- | --- | --- | --- |
| [MMLU](https://arxiv.org/abs/2009.03300) | Accuracy | 0-shot | 60.1 | 64.9 |
| [MBPP](https://arxiv.org/abs/2108.07732) | pass@1 | 3-shot | 56.6 | 63.6 |
| [HumanEval](https://arxiv.org/abs/2107.03374) | pass@1 | 0-shot | 66.5 | 75.0 |
| [LiveCodeBench](https://arxiv.org/abs/2403.07974) | pass@1 | 0-shot | 13.2 | 13.2 |
| HiddenMath | Accuracy | 0-shot | 27.7 | 37.7 |
| [Global-MMLU-Lite](https://huggingface.co/datasets/CohereForAI/Global-MMLU-Lite) | Accuracy | 0-shot | 59.0 | 64.5 |
| [MMLU](https://arxiv.org/abs/2009.03300) (Pro) | Accuracy | 0-shot | 40.5 | 50.6 |

## Usage and Limitations

These models have certain limitations that users should be aware of.

### Intended Usage

Open generative models have a wide range of applications across various industries and domains. The following list of potential uses is not comprehensive. The purpose of this list is to provide contextual information about the possible use-cases that the model creators considered as part of model training and development.

- Content Creation and Communication **Text Generation**: Generate creative text formats such as poems, scripts, code, marketing copy, and email drafts.
- **Chatbots and Conversational AI**: Power conversational interfaces for customer service, virtual assistants, or interactive applications.
- **Text Summarization**: Generate concise summaries of a text corpus, research papers, or reports.
- **Image Data Extraction**: Extract, interpret, and summarize visual data for text communications.
- **Audio Data Extraction**: Transcribe spoken language, translate speech to text in other languages, and analyze sound-based data.

- **Natural Language Processing (NLP) and generative model Research**: These models can serve as a foundation for researchers to experiment with generative models and NLP techniques, develop algorithms, and contribute to the advancement of the field.
- **Language Learning Tools**: Support interactive language learning experiences, aiding in grammar correction or providing writing practice.
- **Knowledge Exploration**: Assist researchers in exploring large bodies of data by generating summaries or answering questions about specific topics.

## Ethics and Safety

Ethics and safety evaluation approach and results.

### Evaluation Approach

Our evaluation methods include structured evaluations and internal red-teaming testing of relevant content policies. Red-teaming was conducted by a number of different teams, each with different goals and human evaluation metrics. These models were evaluated against a number of different categories relevant to ethics and safety, including:

- **Child Safety**: Evaluation of text-to-text and image to text prompts covering child safety policies, including child sexual abuse and exploitation.
- **Content Safety:** Evaluation of text-to-text and image to text prompts covering safety policies including, harassment, violence and gore, and hate speech.
- **Representational Harms**: Evaluation of text-to-text and image to text prompts covering safety policies including bias, stereotyping, and harmful associations or inaccuracies.

In addition to development level evaluations, we conduct “assurance evaluations” which are our ‘arms-length’ internal evaluations for responsibility governance decision making. They are conducted separately from the model development team, to inform decision making about release. High level findings are fed back to the model team, but prompt sets are held-out to prevent overfitting and preserve the results’ ability to inform decision making. Notable assurance evaluation results are reported to our Responsibility & Safety Council as part of release review.

### Evaluation Results

For all areas of safety testing, we saw safe levels of performance across the categories of child safety, content safety, and representational harms relative to previous Gemma models. All testing was conducted without safety filters to evaluate the model capabilities and behaviors. For text-to-text, image-to-text, and audio-to-text, and across all model sizes, the model produced minimal policy violations, and showed significant improvements over previous Gemma models’ performance with respect to high severity violations. A limitation of our evaluations was they included primarily English language prompts.
