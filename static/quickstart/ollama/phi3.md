![](https://github.com/jmorganca/ollama/assets/251292/e06e1a36-97b2-417a-b2b2-028c980359b1)

Phi-3 is a family of open AI models developed by Microsoft.

## Parameter sizes

- [Phi-3 Mini](https://ollama.com/library/phi3:mini) – 3B parameters – `ollama run phi3:mini`
- [Phi-3 Medium](https://ollama.com/library/phi3:medium) – 14B parameters – `ollama run phi3:medium`

## Context window sizes

Note: the 128k version of this model requires [Ollama 0.1.39](https://github.com/ollama/ollama/releases/tag/v0.1.39) or later.

- 4k `ollama run phi3:mini` `ollama run phi3:medium`
- 128k `ollama run phi3:medium-128k`

![image.png](https://ollama.com/assets/library/phi3/83b3de66-82d8-4455-9117-256802c1b82e)

## Phi-3 Mini

Phi-3 Mini is a 3.8B parameters, lightweight, state-of-the-art open model trained with the Phi-3 datasets that includes both synthetic data and the filtered publicly available websites data with a focus on high-quality and reasoning dense properties.

The model has underwent a post-training process that incorporates both supervised fine-tuning and direct preference optimization to ensure precise instruction adherence and robust safety measures.

When assessed against benchmarks testing common sense, language understanding, math, code, long context and logical reasoning, Phi-3 Mini-4K-Instruct showcased a robust and state-of-the-art performance among models with less than 13 billion parameters.

## Phi-3 Medium

Phi-3 Medium is a 14B parameter language model, and outperforms Gemini 1.0 Pro.

![image.png](https://ollama.com/assets/library/phi3/2868e29b-3bba-4c4a-a6ed-1a27fb102867)

## Intended Uses

**Primary use cases**

The model is intended for commercial and research use in English. The model provides uses for applications which require 1) memory/compute constrained environments 2) latency bound scenarios 3) strong reasoning (especially math and logic) 4) long context

Our model is designed to accelerate research on language and multimodal models, for use as a building block for generative AI powered features.

**Use case considerations**

Our models are not specifically designed or evaluated for all downstream purposes. Developers should consider common limitations of language models as they select use cases, and evaluate and mitigate for accuracy, safety, and fariness before using within a specific downstream use case, particularly for high risk scenarios. Developers should be aware of and adhere to applicable laws or regulations (including privacy, trade compliance laws, etc.) that are relevant to their use case. Nothing contained in this Model Card should be interpreted as or deemed a restriction or modification to the license the model is released under.

## Responsible AI Considerations

Like other language models, the Phi series models can potentially behave in ways that are unfair, unreliable, or offensive. Some of the limiting behaviors to be aware of include:

- Quality of Service: the Phi models are trained primarily on English text. Languages other than English will experience worse performance. English language varieties with less representation in the training data might experience worse performance than standard American English.
- Representation of Harms & Perpetuation of Stereotypes: These models can over- or under-represent groups of people, erase representation of some groups, or reinforce demeaning or negative stereotypes. Despite safety post-training, these limitations may still be present due to differing levels of representation of different groups or prevalence of examples of negative stereotypes in training data that reflect real-world patterns and societal biases.
- Inappropriate or Offensive Content: these models may produce other types of inappropriate or offensive content, which may make it inappropriate to deploy for sensitive contexts without additional mitigations that are specific to the use case.
- Information Reliability: Language models can generate nonsensical content or fabricate content that might sound reasonable but is inaccurate or outdated.
- Limited Scope for Code: Majority of Phi-3 training data is based in Python and use common packages such as “typing, math, random, collections, datetime, itertools”. If the model generates Python scripts that utilize other packages or scripts in other languages, we strongly recommend users manually verify all API uses.

Developers should apply responsible AI best practices and are responsible for ensuring that a specific use case complies with relevant laws and regulations (e.g. privacy, trade, etc.). Important areas for consideration include: + Allocation: Models may not be suitable for scenarios that could have consequential impact on legal status or the allocation of resources or life opportunities (ex: housing, employment, credit, etc.) without further assessments and additional debiasing techniques.

- High-Risk Scenarios: Developers should assess suitability of using models in high-risk scenarios where unfair, unreliable or offensive outputs might be extremely costly or lead to harm. This includes providing advice in sensitive or expert domains where accuracy and reliability are critical (ex: legal or health advice). Additional safeguards should be implemented at the application level according to the deployment context.
- Misinformation: Models may produce inaccurate information. Developers should follow transparency best practices and inform end-users they are interacting with an AI system. At the application level, developers can build feedback mechanisms and pipelines to ground responses in use-case specific, contextual information, a technique known as Retrieval Augmented Generation (RAG).
- Generation of Harmful Content: Developers should assess outputs for their context and use available safety classifiers or custom solutions appropriate for their use case.
- Misuse: Other forms of misuse such as fraud, spam, or malware production may be possible, and developers should ensure that their applications do not violate applicable laws and regulations.

## Training

### Model

- Architecture: Phi-3 Mini has 3.8B parameters and is a dense decoder-only Transformer model. The model is fine-tuned with Supervised fine-tuning (SFT) and Direct Preference Optimization (DPO) to ensure alignment with human preferences and safety guidelines.
- Inputs: Text. It is best suited for prompts using chat format.
- Context length: 128K tokens
- GPUS: 512 H100-80G
- Training time: 7 days
- Training data: 3.3T tokens
- Outputs: Generated text in response to the input
- Dates: Our models were trained between February and April 2024
- Status: This is a static model trained on an offline dataset with cutoff date October 2023. Future versions of the tuned models may be released as we improve models.

### Datasets

Our training data includes a wide variety of sources, totaling 3.3 trillion tokens, and is a combination of 1) publicly available documents filtered rigorously for quality, selected high-quality educational data, and code; 2) newly created synthetic, “textbook-like” data for the purpose of teaching math, coding, common sense reasoning, general knowledge of the world (science, daily activities, theory of mind, etc.); 3) high quality chat format supervised data covering various topics to reflect human preferences on different aspects such as instruct-following, truthfulness, honesty and helpfulness.

### Software

- [PyTorch](https://github.com/pytorch/pytorch)
- [DeepSpeed](https://github.com/microsoft/DeepSpeed)
- [Transformers](https://github.com/huggingface/transformers)
- [Flash-Attention](https://github.com/HazyResearch/flash-attention)

### License

The model is licensed under the [MIT license](https://ollama.com/library/phi3:latest/blobs/fa8235e5b48fENSE).

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft trademarks or logos is subject to and must follow [Microsoft’s Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks). Use of Microsoft trademarks or logos in modified versions of this project must not cause confusion or imply Microsoft sponsorship. Any use of third-party trademarks or logos are subject to those third-party’s policies.

## Resources

- [HuggingFace](https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf)
- [Phi-3 Microsoft Blog](https://aka.ms/phi3-blog)
- [Phi-3 Technical Report](https://aka.ms/phi3-tech-report)
- [Phi-3 on Azure AI Studio](https://aka.ms/phi3-azure-ai)
- [Phi-3 on Hugging Face](https://aka.ms/phi3-hf)
- Phi-3 ONNX: [4K](https://aka.ms/phi3-mini-4k-instruct-onnx) and [128K](https://aka.ms/phi3-mini-128k-instruct-onnx)
