![](https://ollama.com/assets/library/llama3.2/be01fadf-7fbd-404d-929b-50a77249b030)

**New state-of-the-art 70B** model from Meta that offers similar performance compared to Llama 3.1 405B model.

The Meta Llama 3.3 multilingual large language model (LLM) is a pretrained and instruction tuned generative model in 70B (text in/text out). The Llama 3.3 instruction tuned text only model is optimized for multilingual dialogue use cases and outperform many of the available open source and closed chat models on common industry benchmarks.

![llama 3.3 benchmark](https://ollama.com/assets/library/llama3.3/70cc3470-fa00-4179-b32e-d40d6494ff4e)

**Supported languages**: English, German, French, Italian, Portuguese, Hindi, Spanish, and Thai.

### New capabilities

This release introduces new capabilities, including a longer context window, multilingual inputs and outputs and possible integrations by developers with third party tools. Building with these new capabilities requires specific considerations in addition to the best practices that generally apply across all Generative AI use cases.

**Tool-use:** Just like in standard software development, developers are responsible for the integration of the LLM with the tools and services of their choice. They should define a clear policy for their use case and assess the integrity of the third party services they use to be aware of the safety and security limitations when using this capability. Refer to the Responsible Use Guide for best practices on the safe deployment of the third party safeguards.

**Multilinguality:** Llama 3.3 supports 7 languages in addition to English: French, German, Hindi, Italian, Portuguese, Spanish, and Thai. Llama may be able to output text in other languages than those that meet performance thresholds for safety and helpfulness. We strongly discourage developers from using this model to converse in non-supported languages without implementing finetuning and system controls in alignment with their policies and the best practices shared in the Responsible Use Guide.

### Intended Use

**Intended Use Cases** Llama 3.3 is intended for commercial and research use in multiple languages. Instruction tuned text only models are intended for assistant-like chat, whereas pretrained models can be adapted for a variety of natural language generation tasks. The Llama 3.3 model also supports the ability to leverage the outputs of its models to improve other models including synthetic data generation and distillation. The Llama 3.3 Community License allows for these use cases.

**Out-of-scope** Use in any manner that violates applicable laws or regulations (including trade compliance laws). Use in any other way that is prohibited by the Acceptable Use Policy and Llama 3.3 Community License. Use in languages beyond those explicitly referenced as supported in this model card**.

**Note:** Llama 3.3 has been trained on a broader collection of languages than the 8 supported languages. Developers may fine-tune Llama 3.3 models for languages beyond the 8 supported languages provided they comply with the Llama 3.3 Community License and the Acceptable Use Policy and in such cases are responsible for ensuring that any uses of Llama 3.3 in additional languages is done in a safe and responsible manner.
