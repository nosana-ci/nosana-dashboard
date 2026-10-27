![](https://github.com/ollama/ollama/assets/251292/01333db3-c27b-4044-88b3-9b2ffbe06415)

Note: this model requires Ollama 0.1.26 or later. [Download it here](https://ollama.com/download).

Gemma is a new open model developed by Google and its DeepMind team. It’s inspired by Gemini models at Google.

Gemma is available in both `2b` and `7b` parameter sizes:

- `ollama run gemma:2b`
- `ollama run gemma:7b` (default)

The models undergo training on a diverse dataset of web documents to expose them to a wide range of linguistic styles, topics, and vocabularies. This includes code to learn syntax and patterns of programming languages, as well as mathematical text to grasp logical reasoning.

To ensure the safety of the model, the team employed various data cleaning and filtering techniques, including rigorous filtering for CSAM (child sexual abuse material), sensitive data filtering, and filtering based on content quality in compliance with Google’s policies.

# Reference

[Google Gemma](https://ai.google.dev/gemma/docs/model_card)
