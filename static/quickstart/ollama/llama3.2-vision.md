![](https://ollama.com/assets/library/llama3.2-vision/ea1fa75c-0d15-453d-a291-ce2d97d8646a)

The Llama 3.2-Vision collection of multimodal large language models (LLMs) is a collection of instruction-tuned image reasoning generative models in 11B and 90B sizes (text + images in / text out). The Llama 3.2-Vision instruction-tuned models are optimized for visual recognition, image reasoning, captioning, and answering general questions about an image. The models outperform many of the available open source and closed multimodal models on common industry benchmarks.

Supported Languages: For text only tasks, English, German, French, Italian, Portuguese, Hindi, Spanish, and Thai are officially supported. Llama 3.2 has been trained on a broader collection of languages than these 8 supported languages. Note for image+text applications, English is the only language supported.

## Usage

First, pull the model:

```
ollama pull llama3.2-vision
```

### Python Library

To use Llama 3.2 Vision with the Ollama [Python library](https://github.com/ollama/ollama-python):

```
import ollama

response = ollama.chat(
    model='llama3.2-vision',
    messages=[{
        'role': 'user',
        'content': 'What is in this image?',
        'images': ['image.jpg']
    }]
)

print(response)
```

### JavaScript Library

To use Llama 3.2 Vision with the Ollama [JavaScript library](https://github.com/ollama/ollama-js):

```
import ollama from 'ollama'

const response = await ollama.chat({
  model: 'llama3.2-vision',
  messages: [{
    role: 'user',
    content: 'What is in this image?',
    images: ['image.jpg']
  }]
})

console.log(response)
```

### cURL

```
curl http://localhost:11434/api/chat -d '{
  &#34;model&#34;: &#34;llama3.2-vision&#34;,
  &#34;messages&#34;: [
    {
      &#34;role&#34;: &#34;user&#34;,
      &#34;content&#34;: &#34;what is in this image?&#34;,
      &#34;images&#34;: [&#34;<base64-encoded image data>&#34;]
    }
  ]
}'
```

## References

[GitHub](https://github.com/meta-llama/llama-models)

[HuggingFace](https://huggingface.co/collections/meta-llama/llama-32-66f448ffc8c32f949b04c8cf)
