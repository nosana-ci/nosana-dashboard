![](https://ollama.com/assets/library/bespoke-minicheck/640ec552-feac-4a35-8651-a85ba3f1f9bd)

This is a grounded factuality checking model developed by [Bespoke Labs](https://bespokelabs.ai/).

The model takes as input a document (text) and a sentence and determines whether the sentence is supported by the document. In order to fact-check a multi-sentence claim, the claim should first be broken up into sentences. The document does not need to be chunked unless it exceeds 32K tokens.

![bespoke-minicheck-howitworks.png](https://ollama.com/assets/library/bespoke-minicheck/4a1f8cce-a9b2-41e1-8d0a-cb4f1c6b5793)

Bespoke-MiniCheck is the SOTA fact-checking model despite its small size.

## Usage

The prompt template is as follows:

```
Document: {document}
Claim: {claim}
```

The response will either be `Yes` or `No`.

## Examples

Prompt

```
Document: A group of students gather in the school library to study for their upcoming final exams.
Claim: The students are preparing for an examination.
```

Response

```
Yes
```

Prompt

```
Document: A group of students gather in the school library to study for their upcoming final exams.
Claim: The students are on vacation.
```

Response

```
No
```

## Model performance

![performance.png](https://ollama.com/assets/jmorgan/bespoke-minicheck/5a757ad2-5eff-4440-a2e7-9efc0bad9703)

The performance of these models is evaluated on our new collected benchmark (unseen by our models during training), [LLM-AggreFact](https://huggingface.co/datasets/lytang/LLM-AggreFact), from 11 recent human annotated datasets on fact-checking and grounding LLM generations. **Bespoke-MiniCheck-7B is the SOTA fact-checking model despite its small size.**

## References

[Website](https://bespokelabs.ai/bespoke-minicheck)

[Paper](https://arxiv.org/pdf/2404.10774)

[LLM-AggreFact Leaderboard](https://llm-aggrefact.github.io/)
