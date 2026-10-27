`d1-omni` is a 600M decision model from Liquid AI, built on LFM2.5-Encoder-350M. Give it a state (text or JSON, with images or a short voice clip) and a set of typed questions, and it returns a calibrated probability for every answer in a single forward pass.

It works through Ollama’s [`/v1/systemone`](https://docs.ollama.com/capabilities/decision) endpoint and `ollama run --ask`.

## Highlights

- **Edge-sized**: 587M parameters, a 0.85 GB download. The same trunk handles every modality, with small vision (94M) and audio (112M) encoders.
- **Images**: one or more images per state; large frames are tiled.
- **Speech**: up to 30 seconds of English speech per request.
- **One forward pass**: every option of every question is scored together, with no output tokens.

For the most accurate decisions over text and images, use [d1](https://ollama.com/library/d1), Liquid AI’s 3B model. Use d1-omni when size matters or you need audio.

## Usage

```
ollama run d1-omni --ask &#34;Is this support request urgent?&#34; < ticket.txt
```

```
curl http://localhost:11434/v1/systemone -d '{
  &#34;model&#34;: &#34;d1-omni&#34;,
  &#34;state&#34;: &#34;Our app crashes on launch for every user since this morning'\''s update. Please fix it now.&#34;,
  &#34;questions&#34;: {
    &#34;urgent&#34;: {&#34;type&#34;: &#34;noul&#34;, &#34;instructions&#34;: &#34;Is this support request urgent?&#34;},
    &#34;team&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;instructions&#34;: &#34;Which team should handle this request?&#34;,
      &#34;criteria&#34;: {
        &#34;billing&#34;: &#34;Payments, invoices, and refunds&#34;,
        &#34;technical&#34;: &#34;Outages, errors, and configuration&#34;,
        &#34;sales&#34;: &#34;Plans and upgrades&#34;
      }
    }
  }
}'
```

d1-omni answers `urgent` with 0.998 and picks `technical` with probability 0.995.

### Speech

Put one base64-encoded WAV clip in `images`, and send audio or images, not both. Clips are cut at 30 seconds. The audio training data was English requests from a speaker to an assistant, so questions about what kind of utterance it is, its topic, and what the speaker wants work best.

```
curl http://localhost:11434/v1/systemone -d '{
  &#34;model&#34;: &#34;d1-omni&#34;,
  &#34;state&#34;: &#34;Voice message from a customer.&#34;,
  &#34;images&#34;: [&#34;<base64-encoded WAV>&#34;],
  &#34;questions&#34;: {
    &#34;intent&#34;: {
      &#34;type&#34;: &#34;choice&#34;,
      &#34;instructions&#34;: &#34;What does the speaker want?&#34;,
      &#34;criteria&#34;: {&#34;timer&#34;: &#34;Set a timer or alarm&#34;, &#34;music&#34;: &#34;Play music&#34;, &#34;weather&#34;: &#34;Hear the weather&#34;, &#34;other&#34;: null}
    }
  }
}'
```

### Images

The model was trained with up to 896 tokens of text alongside images, so keep the state and questions short when you send images.

## Benchmarks

Accuracy reported by Liquid AI on public benchmarks framed as decisions. See the [model card](https://huggingface.co/LiquidAI/d1-omni-600M) for details.

| Benchmark | d1-omni | d1 |
| --- | --- | --- |
| Civil Comments | **95.8** | 93.0 |
| MASSIVE intent | 86.1 | **87.3** |
| PAWS-X | **79.5** | 76.9 |
| BoolQ | 77.7 | **86.7** |
| SQuAD 2.0 | 74.0 | **85.3** |
| **Mean (7 benchmarks)** | 78.4 | **82.9** |

On the harder Decision Index 0.2.1, Liquid AI reports 15.95 for d1-omni and 48.57 for d1.

## License

[LFM Open License v1.0](https://huggingface.co/LiquidAI/d1-omni-600M/blob/main/LICENSE)
