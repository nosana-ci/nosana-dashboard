### Structure Extraction Model by NuMind 🔥

NuExtract is a version of phi-3-mini, fine-tuned on a private high-quality synthetic dataset for information extraction. To use the model, provide an input text (less than 2000 tokens) and a JSON template describing the information you need to extract.

Note: This model is purely extractive, so all text output by the model is present as is in the original text. You can also provide an example of output formatting to help the model understand your task more precisely.

## Usage

### Prompt Format

This model works best when using a specific prompt format to extract text:

```
### Template:
{
    &#34;Model&#34;: {
        &#34;Name&#34;: &#34;&#34;,
        &#34;Number of parameters&#34;: &#34;&#34;,
    },
    &#34;Usage&#34;: {
        &#34;Use case&#34;: [],
        &#34;Licence&#34;: &#34;&#34;
    }
}
### Example:
{
    &#34;Model&#34;: {
        &#34;Name&#34;: &#34;Llama3&#34;,
        &#34;Number of parameters&#34;: &#34;8 billion&#34;,
    },
    &#34;Usage&#34;: {
        &#34;Use case&#34;:[
			&#34;chat&#34;,
			&#34;code completion&#34;
		],
        &#34;Licence&#34;: &#34;Meta Llama3&#34;
    }
}
### Text:
We introduce Mistral 7B, a 7–billion-parameter language model engineered for superior performance and efficiency. Mistral 7B outperforms the best open 13B model (Llama 2) across all evaluated benchmarks, and the best released 34B model (Llama 1) in reasoning, mathematics, and code generation. Our model leverages grouped-query attention (GQA) for faster inference, coupled with sliding window attention (SWA) to effectively handle sequences of arbitrary length with a reduced inference cost. We also provide a model fine-tuned to follow instructions, Mistral 7B – Instruct, that surpasses Llama 2 13B – chat model both on human and automated benchmarks. Our models are released under the Apache 2.0 license. 

Code: https://github.com/mistralai/mistral-src 
Webpage: https://mistral.ai/news/announcing-mistral-7b/
```

### References

[Hugging Face](https://huggingface.co/numind/NuExtract)
