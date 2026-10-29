Requires Ollama v0.13.5 or later

### FunctionGemma

FunctionGemma is a lightweight, open model from Google, built as a foundation for creating your own specialized function calling models. The model is well suited for text-only function calling. The uniquely small size makes it possible to deploy in environments with limited resources such as laptops, desktops or your own cloud infrastructure, democratizing access to state of the art AI models and helping foster innovation for everyone.

FunctionGemma is not intended for use as a direct dialogue model, and is designed to be highly performant after further fine-tuning, as is typical of models this size.

Built on the Gemma 3 270M model and with the same research and technology used to create the Gemini models, FunctionGemma has been trained specifically for function calling. The model has the same architecture as Gemma 3, but uses a different chat format.

Furthermore, akin to the base Gemma 270M, the model has been optimized to be extremely versatile, performant on a variety of hardware in single turn scenarios, but should be finetuned on single turn or multiturn task specific data to achieve best accuracy in specific domains.

### Examples

#### Python

Run the python example with `uv run tool.py`

```
# /// script
# requires-python = &#34;>=3.11&#34;
# dependencies = [
#     &#34;ollama&#34;,
#     &#34;rich&#34;,
# ]
# ///
&#34;&#34;&#34;
Single tool, single turn example.
Run with: uv run tool.py
&#34;&#34;&#34;

import json

from rich import print

from ollama import chat

model = 'functiongemma'


def get_weather(city: str) -> str:
  &#34;&#34;&#34;
  Get the current weather for a city.

  Args:
    city: The name of the city

  Returns:
    A string describing the weather
  &#34;&#34;&#34;
  return json.dumps({'city': city, 'temperature': 22, 'unit': 'celsius', 'condition': 'sunny'})


messages = [{'role': 'user', 'content': 'What is the weather in Paris?'}]
print('Prompt:', messages[0]['content'])

response = chat(model, messages=messages, tools=[get_weather])

if response.message.tool_calls:
  tool = response.message.tool_calls[0]
  print(f'Calling: {tool.function.name}({tool.function.arguments})')

  result = get_weather(**tool.function.arguments)
  print(f'Result: {result}')

  messages.append(response.message)
  messages.append({'role': 'tool', 'content': result})

  final = chat(model, messages=messages)
  print('Response:', final.message.content)
else:
  print('Response:', response.message.content)
```

### TypeScript

Run the TypeScript example with `bun run tool.ts` or `npx tsx tool.ts`

```
/**
 * Single tool, single turn example.
 * Run with: bun run tool.ts or npx tsx tool.ts
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL = 'functiongemma';

function getWeather(city: string): string {
  return JSON.stringify({ city, temperature: 22, unit: 'celsius', condition: 'sunny' });
}

const tools = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a city.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'The name of the city' },
        },
        required: ['city'],
      },
    },
  },
];

interface Message {
  role: string;
  content: string;
  tool_calls?: { function: { name: string; arguments: Record<string, string> } }[];
}

interface ChatResponse {
  message: Message;
}

async function chat(messages: Message[]): Promise<ChatResponse> {
  const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, tools, stream: false }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function main() {
  const messages: Message[] = [{ role: 'user', content: 'What is the weather in Paris?' }];
  console.log('Prompt:', messages[0].content);

  const response = await chat(messages);

  if (response.message.tool_calls?.length) {
    const tool = response.message.tool_calls[0];
    console.log(`Calling: ${tool.function.name}(${JSON.stringify(tool.function.arguments)})\n`);

    const result = getWeather(tool.function.arguments.city);
    console.log('Function Result:', result);

    messages.push(response.message);
    messages.push({ role: 'tool', content: result });

    const final = await chat(messages);
    console.log('Response:', final.message.content);
  } else {
    console.log('Response:', response.message.content);
  }
}

main().catch(console.error);
```

### Benchmark

| **Benchmark** | **n-shot** | **Function Gemma 270m** |
| --- | --- | --- |
| BFCL Simple | 0-shot | 61.6 |
| BFCL Multiple | 0-shot | 63.5 |
| BFCL Parallel | 0-shot | 39 |
| BFCL Parallel Multiple | 0-shot | 29.5 |
| BFCL Live Simple | 0-shot | 36.2 |
| BFCL Live Multiple | 0-shot | 25.7 |
| BFCL Live Parallel | 0-shot | 22.9 |
| BFCL Live Parallel Multiple | 0-shot | 20.8 |
| BFCL Relevance | 0-shot | 61.1 |
| BFCL Irrelevance | 0-shot | 73.7 |

### Training Dataset

These models were trained on a dataset of text data that includes a wide variety of sources. The model was trained with 6T tokens. The knowledge cutoff date for the training data was August 2024. There are the key components:

- Public Tool Definitions - Common APIs found on the web
- Tool Use Interactions - These are a mix of prompts, function calls, function responses, and natural language responses from the model to summarise the function call response, or request clarifications when the prompt is ambiguous or incomplete.

### Data Preprocessing

Here are the key data cleaning and filtering methods applied to the training data:

- CSAM Filtering: Rigorous CSAM (Child Sexual Abuse Material) filtering was applied at multiple stages in the data preparation process to ensure the exclusion of harmful and illegal content.
- Sensitive Data Filtering: As part of making Gemma pre-trained models safe and reliable, automated techniques were used to filter out certain personal information and other sensitive data from training sets.
- Additional methods: Filtering based on content quality and safety in line with Google’s [policies](https://ai.google/static/documents/ai-responsibility-update-published-february-2025.pdf).
