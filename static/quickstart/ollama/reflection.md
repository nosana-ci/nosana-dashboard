During sampling, the model will start by outputting reasoning inside `<thinking>` and `</thinking>` tags, and then once it is satisfied with its reasoning, it will output the final answer inside `<output>` and `</output>` tags. Each of these tags are special tokens, trained into the model.

This enables the model to separate its internal thoughts and reasoning from its final answer, improving the experience for the user.

Inside the `<thinking>` section, the model may output one or more `<reflection>` tags, which signals the model has caught an error in its reasoning and will attempt to correct it before providing a final answer.

## References

[Hugging Face](https://huggingface.co/mattshumer/ref_70_e3)
