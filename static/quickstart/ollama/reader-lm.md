![](https://ollama.com/assets/library/reader-lm/1a8f6262-c6af-4f5f-b7e9-2eeb162fa8d2)

Jina Reader-LM is a series of models that convert HTML content to Markdown content, which is useful for content conversion tasks. The model is trained on a curated collection of HTML content and its corresponding Markdown content.

## Example

Prompt

```
<html>
  <body>
    <h3>Why is the sky blue?</h3>
    <p>The sky appears blue because of the way light from the sun is reflected by the atmosphere. The atmosphere is made up of gases, including nitrogen and oxygen, which scatter light in all directions. This scattering causes the sunlight to appear as a rainbow of colors, with red light scattered more than other colors.
    </p>
  </body>
</html>
```

Response

```
### Why is the sky blue?

The sky appears blue because of the way light from the sun is reflected by the atmosphere. The atmosphere is made up of gases, including nitrogen and oxygen, which scatter light in all directions. This scattering causes the sunlight to appear as a rainbow of colors, with red light scattered more than other colors.
```

## Reference

[Hugging Face](https://huggingface.co/jinaai/reader-lm-1.5b)
