MedLlama2 by Siraj Raval is a Llama 2-based model trained with [MedQA dataset](https://huggingface.co/datasets/medalpaca/medical_meadow_medqa) to be able to provide medical answers to questions. It is not intended to replace a medical professional, but to provide a starting point for further research.

### CLI

Open the terminal and run `ollama run medllama2`

### API

Example:

```
curl -X POST http://localhost:11434/api/generate -d '{
  &#34;model&#34;: &#34;medllama2&#34;,
  &#34;prompt&#34;:&#34;A 35-year-old woman presents with a persistent dry cough, shortness of breath, and fatigue. She is initially suspected of having asthma, but her spirometry results do not improve with bronchodilators. What could be the diagnosis?&#34;
 }'
```

## Memory requirements

- 7b models generally require at least 8GB of RAM

## Reference

[llSourcell](https://huggingface.co/llSourcell/medllama2_7b)
