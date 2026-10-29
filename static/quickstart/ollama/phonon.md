Phonon is [Gradium’s](https://huggingface.co/gradium) text-to-speech family. It turns written text into spoken audio as it generates, making it useful for reading assistant replies, narrating passages, and adding a voice to local apps.

```
ollama run phonon &#34;Good morning. Here is a short update before your first meeting.&#34;
```

The default model is [Phonon 31M English](https://huggingface.co/gradium/phonon-31m-en). It includes one voice, named `default`. Choose a 40M model for another language or for the multilingual checkpoint:

| Ollama tag | Language | Loaded memory on Apple M5 Max |
| --- | --- | --- |
| `phonon` (`phonon:31m-en`, `phonon:en`) | English, 31M | 121 MB |
| `phonon:40m-en` | English, 40M | 141 MB |
| `phonon:40m-fr` (`phonon:fr`) | French, 40M | 141 MB |
| `phonon:40m-de` (`phonon:de`) | German, 40M | 141 MB |
| `phonon:40m-es` (`phonon:es`) | Spanish, 40M | 141 MB |
| `phonon:40m-pt` (`phonon:pt`) | Portuguese, 40M | 141 MB |
| `phonon:40m-multilingual` (`phonon:multilingual`) | All five languages, 40M | 141 MB |

The 31M English checkpoint is released under [Apache 2.0](https://www.apache.org/licenses/LICENSE-2.0). The [40M English](https://huggingface.co/gradium/phonon-40m-en), [French](https://huggingface.co/gradium/phonon-40m-fr), [German](https://huggingface.co/gradium/phonon-40m-de), [Spanish](https://huggingface.co/gradium/phonon-40m-es), [Portuguese](https://huggingface.co/gradium/phonon-40m-pt), and [multilingual](https://huggingface.co/gradium/phonon-40m-multilingual) checkpoints are released under [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/), which limits use to noncommercial purposes.

Phonon produces 24 kHz mono audio. These Ollama packages require Apple Silicon and Ollama 0.40.9 or later. Give the model text intended to be spoken; formatting marks such as Markdown headings may be read aloud. For saving audio or using the speech API, see the [Ollama speech guide](https://docs.ollama.com/capabilities/speech).
