![](https://ollama.com/assets/library/granite3.2/90c5e567-0004-425c-a17a-1b846c2b5d3d)

### Granite 4.0 models

**Granite 4.0 models** are finetuned from their base models using a combination of open source instruction datasets with permissive license and internally collected synthetic datasets. They feature improved instruction following (IF) and tool-calling capabilities, making them more effective in enterprise applications.

**Please Note:** the 3b, 1b, and 350m model sizes are alternative options for users when mamba-2 support is not yet optimized. Models denoted -h use the hybrid mamba-2 architecture.

#### Parameter Sizes

**350m**

```
ollama run granite4:350m
```

**350m-h**

```
ollama run granite4:350m-h
```

**1b**

```
ollama run granite4:1b
```

**1b-h**

```
ollama run granite4:1b-h
```

**3b (micro)**

```
ollama run granite4:3b
ollama run granite4:micro
```

**3b-h (micro-h)**

```
ollama run granite4:3b-h
ollama run granite4:micro-h
```

**7b-a1b-h (tiny-h)**

```
ollama run granite4:7b-a1b-h
ollama run granite4:tiny-h
```

**32b-a9b-h (small-h)**

```
ollama run granite4:32b-a9b-h
ollama run granite4:small-h
```

#### Supported Languages

English, German, Spanish, French, Japanese, Portuguese, Arabic, Czech, Italian, Korean, Dutch, and Chinese. Users may finetune Granite 4.0 models for languages beyond these languages.

#### Intended Use

This model is designed to handle general instruction-following tasks and can be integrated into AI assistants across various domains, including business applications.

#### Capabilities

- Summarization
- Text classification
- Text extraction
- Question-answering
- Retrieval Augmented Generation (RAG)
- Code related tasks
- Function-calling tasks
- Multilingual dialog use cases
- Fill-In-the-Middle (FIM) code completions

#### Learn more

- Developers: Granite Team, IBM
- Website: [Granite Docs](https://www.ibm.com/granite/docs)
- GitHub Repository: [ibm-granite/granite-4.0-language-models](https://github.com/ibm-granite/granite-4.0-language-models)
- Release Date: October 2nd, 2025
- License: [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)
