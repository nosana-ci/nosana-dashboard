![](https://ollama.com/assets/library/granite3.2/90c5e567-0004-425c-a17a-1b846c2b5d3d)

Granite-3.2 is a family of long-context AI models fine-tuned for thinking capabilities. Built on top of Granite-3.1, it has been trained using a mix of permissively licensed open-source datasets and internally generated synthetic data designed for reasoning tasks. The models allow controllability of its thinking capability, ensuring it is applied only when required.

- **Developers:** Granite Team, IBM
- **Website**: [Granite Docs](https://www.ibm.com/granite/docs/)
- **Release Date**: February 26th, 2025
- **License:** [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0)

**Sizes**

The models are available in two parameter sizes, 2B and 8B:

```
ollama run granite3.2:2b
```

```
ollama run granite3.2:8b
```

**Supported Languages:** English, German, Spanish, French, Japanese, Portuguese, Arabic, Czech, Italian, Korean, Dutch, and Chinese. However, users may finetune this Granite model for languages beyond these 12 languages.

**Intended Use:** These models are designed to handle general instruction-following tasks and can be integrated into AI assistants across various domains, including business applications.

**Capabilities**

- **Thinking**
- Summarization
- Text classification
- Text extraction
- Question-answering
- Retrieval Augmented Generation (RAG)
- Code related tasks
- Function-calling tasks
- Multilingual dialog use cases
- Long-context tasks including long document/meeting summarization, long document QA, etc.

**Thinking**

To enable thinking, add a message with `&#34;role&#34;: &#34;control&#34;` and set `&#34;content&#34;` to `&#34;thinking&#34;`. For example:

```
{
    &#34;messages&#34;: [
        {&#34;role&#34;: &#34;control&#34;, &#34;content&#34;: &#34;thinking&#34;},
        {&#34;role&#34;: &#34;user&#34;, &#34;content&#34;: &#34;How do I get to the airport if my car won't start?&#34;}
    ]
}
```

## References

[Website](https://www.ibm.com/granite)
