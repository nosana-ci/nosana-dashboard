import OpenAI from "openai/index.mjs";

/**
 * Creates an OpenAI client configured with the provided API URL and optional API key
 * @param {string} apiUrl - The base URL for the OpenAI API
 * @param {string} apiKey - Optional API key (defaults to 'token-abc123')
 * @returns {OpenAI} - Configured OpenAI client
 */
export function createOpenAIClient(apiUrl: string, apiKey = "token-abc123"): OpenAI {
  // Ensure the URL is properly formatted
  const baseURL = apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl;

  return new OpenAI({
    baseURL: `${baseURL}/v1`,
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
}

interface ChatCompletionOptions {
  temperature?: number;
  maxTokens?: number;
}

// Export the ChatMessage type
export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

/**
 * Sends a chat completion request to the OpenAI API
 * @param {OpenAI} client - The OpenAI client
 * @param {Array} messages - Array of message objects with role and content
 * @param {string} model - The model to use for completion
 * @param {Object} options - Additional options like temperature and max_tokens
 * @returns {Promise} - Promise resolving to the completion response
 */
export async function sendChatCompletion(
  client: any,
  messages: ChatMessage[],
  model: string,
  options: ChatCompletionOptions = {}
) {
  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
    });

    return {
      content: completion.choices[0]?.message?.content,
      tokenUsage: completion.usage
        ? {
            promptTokens: completion.usage.prompt_tokens,
            completionTokens: completion.usage.completion_tokens,
            totalTokens: completion.usage.total_tokens,
          }
        : undefined,
      rawResponse: completion,
    };
  } catch (error) {
    console.error("Error sending chat completion:", error);
    throw error;
  }
}

/**
 * Sends a streaming chat completion request to the OpenAI API
 * @param {OpenAI} client - The OpenAI client
 * @param {ChatMessage[]} messages - Array of message objects with role and content
 * @param {string} model - The model to use for completion
 * @param {Object} options - Additional options like temperature (max_tokens is ignored for streaming)
 * @returns {Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>>} - Promise resolving to an async iterable stream of completion chunks
 */
export async function streamChatCompletion(
  client: any,
  messages: ChatMessage[],
  model: string,
  options: Omit<ChatCompletionOptions, 'maxTokens'> = {} // Exclude maxTokens for streaming
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> {
  try {
    const stream = await client.chat.completions.create({
      model: model,
      messages: messages,
      temperature: options.temperature || 0.7,
      stream: true, // Enable streaming
    });
    return stream;
  } catch (error) {
    console.error("Error initiating chat completion stream:", error);
    throw error;
  }
} 