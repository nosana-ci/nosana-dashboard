<template>
  <div class="nosana-chat-integrated">
    <div class="chat-container">
      <div v-if="!chatServiceUrl" class="status-message plain-status">
        <i class="fas fa-exclamation-circle"></i>
        Chat service not ready. Please wait for the job to be fully online.
      </div>
      <div v-else-if="!openAIClient" class="error-message">
        <i class="fas fa-times-circle error-icon"></i>
        Could not initialize OpenAI client.
      </div>
      <template v-else>
        <!-- Centered layout for initial screen -->
        <div v-if="messages.length === 0" class="initial-screen">
          <div class="initial-content">
            <div class="title-container">
              <img src="~/assets/img/token_icons/nosana-nos-logo.svg" alt="Nosana" class="nosana-logo" />
              <h3 class="model-title">Nosana Test Chat</h3>
            </div>
            <p class="model-subtitle">{{ modelName }}</p>
            <p class="empty-state-text">How can I help you today?</p>
            
            <div class="input-area">
              <form @submit.prevent="sendMessage" class="message-form">
                <div class="input-container">
                  <textarea 
                    class="message-input"
                    v-model="newMessage" 
                    @keydown.enter.exact.prevent="sendMessage" 
                    placeholder="Ask anything..." 
                    :disabled="isLoading"
                    ref="messageInputRef"
                    rows="1"
                  ></textarea>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Normal chat layout for when messages exist -->
        <template v-else>
          <div class="chat-header">
            <div class="active-chat-title-area">
              <div class="title-container">
                <img src="~/assets/img/token_icons/nosana-nos-logo.svg" alt="Nosana" class="nosana-logo" />
                <h3 class="model-title">Nosana Test Chat</h3>
              </div>
              <p class="model-subtitle">{{ modelName }}</p>
            </div>
            <button class="button is-small is-light clear-chat-button" @click="clearChat" title="Clear chat history">
              <span class="icon is-small">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/></svg>
              </span>
              <span>Clear Chat</span>
            </button>
          </div>
          
          <div class="message-area" ref="messageAreaRef">
            <div class="messages">
              <div v-for="(message, index) in messages" :key="index" 
                  :class="['message-container', message.role === 'user' ? 'message-user' : 'message-agent']">
                
                <div class="message-content">
                  <!-- User message: Render plain content -->
                  <div v-if="message.role === 'user'" class="message-text markdown-body" v-html="renderMarkdown(message.content || '')"></div>

                  <!-- Assistant message: Iterate through sections -->
                  <template v-if="message.role === 'assistant' && message.sections">
                    <div v-for="(section, sectionIndex) in message.sections" :key="sectionIndex" :class="'message-section-' + section.type">
                      
                      <!-- Thoughts Section -->
                      <div v-if="section.type === 'thoughts'" class="thinking-section">
                        <details>
                            <summary class="thinking-toggle">
                                <ArrowExpandIcon class="expand-arrow" />
                                <i class="fas fa-fw fa-chevron-down"></i>
                                Thinking tokens
                            </summary>
                            <div class="thinking-content">
                                <pre><code>{{ section.content }}</code></pre>
                            </div>
                        </details>
                      </div>

                      <!-- Regular Text Section -->
                      <div v-if="section.type === 'regular'" class="message-text markdown-body" v-html="renderMarkdown(section.content)"></div>

                    </div>
                  </template>
                  <!-- Fallback for assistant messages without sections (e.g., error messages) -->
                  <div v-else-if="message.role === 'assistant' && !message.sections && message.content" 
                       class="message-text markdown-body" 
                       v-html="renderMarkdown(message.content)">
                  </div>
                </div>
              </div>
              
              <!-- Loading indicator -->
              <div v-if="isLoading" class="message-container message-agent">
                  <div class="message-content">
                      <div class="typing-container">
                          <div class="processing-indicator">
                              <i class="fas fa-spinner spinner-icon"></i>
                              <span>Thinking...</span>
                          </div>
                      </div>
                  </div>
              </div>
            </div>
          </div>
          
          <div class="input-area">
            <form @submit.prevent="sendMessage" class="message-form">
              <div class="input-container">
                <textarea 
                  class="message-input"
                  v-model="newMessage" 
                  @keydown.enter.exact.prevent="sendMessage" 
                  placeholder="Ask anything..." 
                  :disabled="isLoading"
                  ref="messageInputRef"
                  rows="1"
                ></textarea>
              </div>
            </form>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import type { UseJob } from "~/composables/jobs/useJob";
import { createOpenAIClient, sendChatCompletion, sendCustomChatCompletion, type ChatMessage } from '~/composables/useOpenaiAPI';
import type { OperationArgsMap, ExposedPort, HttpHealthCheck } from '@nosana/kit';
import { marked } from 'marked';
import ArrowExpandIcon from '@/assets/img/icons/arrow-expand.svg?component';
import type { Tokens } from 'marked';

// New interface provided by user
interface MessageSection {
  type: 'thoughts' | 'regular'; // Removed 'image_generation'
  content: string;
  // Removed image_generation specific fields
}

interface Props {
  job: UseJob;
  chatServiceUrl?: string | null;
  chatApiConfig?: {
    path: string;
    model: string;
    headers?: Record<string, string>;
  } | null;
}

interface ExtendedChatMessage extends ChatMessage {
  sections?: MessageSection[]; // Replaces thinking and simplifies content for assistant
  id?: string;
  // showThinking is removed, <details> will manage its own state
}

const props = defineProps<Props>();

const messages = ref<ExtendedChatMessage[]>([]); 
const newMessage = ref('');
const isLoading = ref(false);
const messageInputRef = ref<HTMLTextAreaElement | null>(null);
const messageAreaRef = ref<HTMLDivElement | null>(null);

const renderer = new marked.Renderer();

renderer.link = (token: Tokens.Link): string => {
  const href = token.href || '';
  const title = token.title || '';
  const text = token.text || '';
  return `<a href="${href}" title="${title}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};

marked.setOptions({
  renderer: renderer,
  gfm: true,
  breaks: false, 
});

const renderMarkdown = (text: string) => {
  const rendered = marked(text || '');
  if (typeof rendered === 'string') {
    return rendered.trim();
  }
  console.warn('marked() returned a Promise. Asynchronous rendering not fully handled in this path.');
  return text.trim() || ''; 
};

// New parser function provided by user
const parseMessageContent = (content: string): MessageSection[] => {
  const sections: MessageSection[] = [];
  let lastIndex = 0;
  let match;

  // Handle incomplete thought at the very beginning (e.g., "<think>some thoughts")
  if (content.startsWith('<think>') && !content.includes('</think>')) {
    return [{ type: 'thoughts', content: content.replace('<think>', '').trim() }];
  }

  // Regex for complete <think>...</think> blocks
  const thoughtsRegex = /<think>([^]*?)<\/think>/g;
  
  // First pass: find all complete <think>...</think> blocks
  while ((match = thoughtsRegex.exec(content)) !== null) {
    // Add regular text before this complete thought block
    if (match.index > lastIndex) {
      const regularText = content.slice(lastIndex, match.index).trim();
      if (regularText) sections.push({ type: 'regular', content: regularText });
    }
    // Add the complete thought block
    const thoughtContent = match[1].trim();
    if (thoughtContent) sections.push({ type: 'thoughts', content: thoughtContent });
    lastIndex = thoughtsRegex.lastIndex;
  }

  // Process remaining text after the last complete <think>...</think> block (or the whole string if none found)
  const remainingContent = content.slice(lastIndex).trim();
  
  if (remainingContent) {
    const loneEndThinkTagIndex = remainingContent.indexOf('</think>');

    if (loneEndThinkTagIndex !== -1) {
      // Found a </think> tag without a preceding <think> in this segment
      const thoughtsBeforeLoneTag = remainingContent.substring(0, loneEndThinkTagIndex).trim();
      if (thoughtsBeforeLoneTag) {
        sections.push({ type: 'thoughts', content: thoughtsBeforeLoneTag });
      }
      
      const regularAfterLoneTag = remainingContent.substring(loneEndThinkTagIndex + '</think>'.length).trim();
      if (regularAfterLoneTag) {
        sections.push({ type: 'regular', content: regularAfterLoneTag });
      }
    } else {
      // No lone </think> tag, so the rest is regular content
      sections.push({ type: 'regular', content: remainingContent });
    }
  }
  
  return sections.filter(section => section.content); // Filter out any truly empty sections
}

const openAIClient = computed(() => {
  if (props.chatServiceUrl && props.chatApiConfig) {
    // Create client with dynamic base URL based on API path
    const baseUrl = props.chatServiceUrl.endsWith("/") 
      ? props.chatServiceUrl.slice(0, -1) 
      : props.chatServiceUrl;
    
    // Determine if this is OpenAI-compatible (vLLM) or Ollama format
    const isOpenAICompatible = props.chatApiConfig.path.startsWith("/v1");
    
    if (isOpenAICompatible) {
      // vLLM uses standard OpenAI format with /v1 prefix
      return createOpenAIClient(props.chatServiceUrl);
    } else {
      // Ollama or other custom format - create client with custom base URL
      return createOpenAIClient(baseUrl, "token-abc123");
    }
  }
  return null;
});

const modelName = computed(() => {
  // First, try to get model name from chatApiConfig
  if (props.chatApiConfig?.model && props.chatApiConfig.model !== 'unknown') {
    return props.chatApiConfig.model;
  }

  // Fallback to job definition parsing
  if (props.job?.jobDefinition?.ops) {
    for (const op of props.job.jobDefinition.ops) {
      if (op.type === 'container/run') { 
        const args = op.args as OperationArgsMap['container/run']; 
        if (args.env) {
          const modelEnv = Object.entries(args.env).find(([key]) => key.toUpperCase() === 'MODEL' || key.toUpperCase() === 'MODEL_NAME' || key.toUpperCase() === 'OPENAI_MODEL');
          if (modelEnv && modelEnv[1]) return modelEnv[1];
        }
        if (args.expose && Array.isArray(args.expose)) {
          const exposedPorts = args.expose.filter(
            (e): e is ExposedPort => typeof e === 'object' && e !== null && 'health_checks' in e
          );
          for (const exposedPort of exposedPorts) {
            if (exposedPort.health_checks) {
              for (const healthCheck of exposedPort.health_checks) {
                if (healthCheck.type === 'http' && (healthCheck as any).body) { 
                  try {
                    const body = JSON.parse((healthCheck as any).body as string);
                    if (body.model) return body.model;
                  } catch (e) { /* ignore parse error */ }
                }
              }
            }
          }
        }
      }
    }
  }
  return 'AI Model';
});

function clearChat() {
  messages.value = [];
}

async function autoResizeTextarea() {
  await nextTick();
  if (messageInputRef.value) {
    messageInputRef.value.style.height = 'auto';
    const scrollHeight = messageInputRef.value.scrollHeight;
    const maxHeight = 150;
    messageInputRef.value.style.height = Math.min(scrollHeight, maxHeight) + 'px';
  }
}

watch(newMessage, autoResizeTextarea);

async function sendMessage() {
  if (!newMessage.value.trim() || !openAIClient.value) return;

  const userMessage: ExtendedChatMessage = { 
    role: 'user', 
    content: newMessage.value.trim(), // User messages don't have sections
    id: Date.now().toString() 
  };
  messages.value.push(userMessage);
  
  // Manually scroll after user message
  nextTick(() => {
    if (messageAreaRef.value) {
      messageAreaRef.value.scrollTo({
        top: messageAreaRef.value.scrollHeight,
        behavior: 'smooth'
      });
    }
  });
  
  const currentNewMessage = newMessage.value;
  newMessage.value = ''; 
  await autoResizeTextarea();
  isLoading.value = true;

  const apiMessages: ChatMessage[] = messages.value
    .filter(msg => msg.id !== userMessage.id)
    .slice(-5)
    .map(msg => ({ role: msg.role, content: msg.content || '' })); // Ensure content is always a string
  
  apiMessages.push({role: 'user', content: currentNewMessage.trim()});

  try {
    let response;
    
    if (props.chatApiConfig?.path?.startsWith("/v1")) {
      // vLLM or OpenAI-compatible API
      response = await sendChatCompletion(
        openAIClient.value,
        apiMessages, 
        modelName.value
      );
    } else if (props.chatApiConfig && props.chatServiceUrl) {
      // Ollama or other custom API
      const baseUrl = props.chatServiceUrl.endsWith("/") 
        ? props.chatServiceUrl.slice(0, -1) 
        : props.chatServiceUrl;
      
      response = await sendCustomChatCompletion(
        baseUrl,
        props.chatApiConfig.path,
        apiMessages,
        modelName.value,
        props.chatApiConfig.headers || {}
      );
    } else {
      // Fallback to standard OpenAI client
      response = await sendChatCompletion(
        openAIClient.value,
        apiMessages, 
        modelName.value
      );
    }
    
    if (response.content) {
      const parsedSections = parseMessageContent(response.content);
      const assistantMessage: ExtendedChatMessage = {
        role: 'assistant',
        sections: parsedSections,
        // The 'content' field for assistant can be a join of regular sections or a summary
        // For simplicity, we can leave it undefined or join regular text sections.
        // The template will primarily iterate over `sections`.
        content: parsedSections.filter(s => s.type === 'regular').map(s => s.content).join('\n'),
        id: Date.now().toString() + '-ai'
      };
      messages.value.push(assistantMessage);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    messages.value.push({ 
      role: 'assistant', 
      content: 'Sorry, I encountered an error. Please try again.', 
      id: Date.now().toString() + '-error'
    });
  } finally {
    isLoading.value = false;
  }
}

watch(messages, () => {
  nextTick(() => {
    if (messageAreaRef.value) {
      messageAreaRef.value.scrollTo({
        top: messageAreaRef.value.scrollHeight,
        behavior: 'smooth'
      });
    }
  });
});

watch(isLoading, (newValue) => {
  if (!newValue) {
    nextTick(() => {
      if (messageAreaRef.value) {
        messageAreaRef.value.scrollTo({
          top: messageAreaRef.value.scrollHeight,
          behavior: 'smooth'
        });
      }
    });
  }
});
</script>

<style lang="scss" scoped>
@use "sass:color";
// Define CSS Variables for theming based on global website theme

// Default Light Mode Variables within the component scope
.nosana-chat-integrated {
  --chat-bg: #f9fafb; // Light gray/off-white for main background
  --chat-bg-darker: #ffffff; // Pure white for input backgrounds etc. in light mode
  --chat-text-primary: #1f2937; 
  --chat-text-secondary: #6b7280; 
  --chat-accent: #16a34a; 
  --chat-border: #e5e7eb; 

  --chat-user-message-bg: #dcfce7; 
  --chat-user-message-border: #86efac; 

  --chat-thinking-bg: #f3f4f6; 
  --chat-thinking-border: #d1d5db; 
  --chat-thinking-content-code-bg: #e5e7eb;
  --chat-thinking-content-code-border: #d1d5db;

  --chat-code-bg: #f3f4f6;
  --chat-code-border: #d1d5db;

  --chat-scrollbar-track: rgba(0,0,0,0.05);
  --chat-scrollbar-thumb: rgba(22, 163, 74, 0.4); 

  --chat-error-bg: #fee2e2; 
  --chat-error-border: #fca5a5;
  --chat-error-text: #b91c1c; 
}

// Dark Mode Variable Overrides - applied when .dark-mode class is present on <html>
// Targeting .nosana-chat-integrated when it's a child of html.dark-mode
html.dark-mode .nosana-chat-integrated {
  --chat-bg: #1a1a1a; 
  --chat-bg-darker: #2c2c2c; 
  --chat-text-primary: #ffffff; 
  --chat-text-secondary: rgba(255, 255, 255, 0.7); 
  --chat-accent: #1bff45; 
  --chat-border: rgba(255, 255, 255, 0.3);

  --chat-user-message-bg: rgba(27, 255, 69, 0.1); 
  --chat-user-message-border: rgba(255, 255, 255, 0.3);
  
  --chat-thinking-bg: rgba(34, 34, 34, 0.3); 
  --chat-thinking-border: rgba(34, 34, 34, 0.6); 
  --chat-thinking-content-code-bg: rgba(0, 0, 0, 0.4);
  --chat-thinking-content-code-border: rgba(34, 34, 34, 0.4);

  --chat-code-bg: rgba(0, 0, 0, 0.5);
  --chat-code-border: #222222; 

  --chat-scrollbar-track: rgba(255,255,255,0.05);
  --chat-scrollbar-thumb: rgba(27, 255, 69, 0.4); 

  --chat-error-bg: rgba(255, 56, 96, 0.1); 
  --chat-error-border: rgba(255, 56, 96, 0.2);
  --chat-error-text: #ff3860;
}

// SCSS Variables (original, for reference)
$border-radius: 12px;
$transition-speed: 0.2s;
$message-spacing: 20px; 

.nosana-chat-integrated {
  height: 82vh; 
  width: 100%;
  background-color: var(--chat-bg);
  color: var(--chat-text-primary);
  font-family: "Inter", sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden; 
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 670px;
  width: 100%;
  margin: 0 auto;
  overflow: hidden;
}

.chat-header {
  padding: 16px $message-spacing 12px $message-spacing;
  background-color: var(--chat-bg);
  position: relative;
}

.title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.title-container .nosana-logo {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.model-title {
  font-size: 25px;
  font-weight: 600;
  margin: 0;
  color: var(--chat-text-primary);
  font-family: "Inter", sans-serif;
  text-align: center;
}

.model-subtitle {
  font-size: 14px;
  color: var(--chat-text-secondary);
  margin: 0 0 16px 0;
  font-weight: 500;
  text-align: center;
}

.message-area {
  flex: 1;
  padding: $message-spacing;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: var(--chat-bg);
  font-family: "Outfit", sans-serif;
  
  // Hide scrollbar completely
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
  &::-webkit-scrollbar { 
    display: none; /* WebKit */
  }
}

.messages {
  display: flex;
  flex-direction: column;
  gap: $message-spacing;
}

.message-container {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  
  &.message-user {
    align-items: flex-end;
    .message-content {
      border: 1px solid var(--chat-border);
      border-radius: $border-radius;
      padding: 12px 16px;
      max-width: 85%;
    }
  }
  
  &.message-agent {
    align-items: flex-start;
    .message-content {
      max-width: 95%;
    }
  }
}

.message-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: fit-content;
  overflow: hidden;
}

.thinking-section {
  background-color: var(--chat-thinking-bg);
  border: 1px solid var(--chat-thinking-border);
  border-radius: 8px;
  padding: 8px 12px;
  margin-bottom: 8px;
}

.thinking-toggle {
  cursor: pointer;
  color: var(--chat-text-secondary);
  font-size: 0.9em;
  font-weight: 500;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    opacity: 0.8;
  }
  
  i {
    transition: transform 0.2s ease;
    color: var(--chat-accent);
  }

  .expand-arrow {
    width: 16px;
    height: 16px;
    opacity: 0.7;
    transition: transform 0.2s ease;
    transform: rotate(-90deg); /* Point right when collapsed */
  }
}

details[open] .thinking-toggle .expand-arrow {
  transform: rotate(0deg); /* Point down when expanded */
}

.thinking-content {
  margin-top: 8px;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  
  pre {
    background-color: var(--chat-thinking-content-code-bg) !important;
    border: 1px solid var(--chat-thinking-content-code-border) !important;
    padding: 10px !important;
    border-radius: 6px;
    margin: 0;
    
    code {
      background-color: transparent !important;
      border: none !important;
      padding: 0 !important;
      font-size: 0.9em !important;
      color: var(--chat-text-secondary) !important;
      white-space: pre-wrap;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    }
  }
}

details[open] .thinking-content {
  max-height: 1000px; /* Adjust this value based on your needs */
  transition: max-height 0.5s ease-in;
}

.message-text {
  font-size: 16px;
  line-height: 1.6;
  word-break: break-word;
  color: var(--chat-text-primary);
  font-family: inherit;
}

.markdown-body {
  font-size: 16px;
  line-height: 1.6;
  color: var(--chat-text-primary);

  :deep(p) { 
    margin-top: 0;
    margin-bottom: 1rem;
    &:last-child { margin-bottom: 0; }
  }
  :deep(p + p) { 
    margin-top: 0;
  }
  :deep(ul) {
    list-style-type: disc;
    list-style-position: outside;
    margin-left: 1rem;
    margin-bottom: 0.8em;
    padding-left: 1em; 
  }
  :deep(ol) {
    list-style-type: decimal;
    list-style-position: outside;
    margin-left: 1rem;
    margin-bottom: 0.8em;
    padding-left: 1em; 
  }
  :deep(li) {
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
    margin-bottom: 0;
  }

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    font-weight: 600;
    line-height: 1.3;
    color: var(--chat-text-primary); 
    font-family: "Inter", sans-serif;
  }
  :deep(h1) { font-size: 30px; }
  :deep(h2) { font-size: 24px; }  
  :deep(h3) { font-size: 20px; } 
  :deep(h4) { font-size: 18px; }
  :deep(h5) { font-size: 16px; }    
  :deep(h6) { font-size: 14px; }

  :deep(code) {
    background-color: var(--chat-code-bg);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
    font-size: 0.9em;
    border: 1px solid var(--chat-code-border);
    word-break: break-all;
  }
  :deep(pre) {
    background-color: var(--chat-code-bg);
    padding: 1em;
    border-radius: 6px;
    border: 1px solid var(--chat-code-border);
    overflow-x: auto;
    margin-bottom: 1em;
    code {
      background-color: transparent;
      padding: 0;
      border: none;
      font-size: 1em;
      white-space: pre-wrap; 
    }
  }
  :deep(a) { 
    color: var(--chat-accent);
    text-decoration: none; 
    &:hover { text-decoration: underline; }
  }
  :deep(strong),
  :deep(b) { 
    font-weight: 600;
    color: var(--chat-text-primary); 
  }
  :deep(blockquote) {
    border-left: 4px solid var(--chat-border);
    padding-left: 1rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
    margin-left: 0;
    font-style: italic;
    color: var(--chat-text-secondary);
  }
}

.status-message, .error-message, .plain-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 15px;
  border-radius: $border-radius;
  font-size: 14px;
  margin: $message-spacing auto;
  width: fit-content;
  max-width: 80%;
}

.plain-status {
  background-color: transparent;
  border: none;
  color: var(--chat-text-secondary);
}

.error-message {
  background-color: var(--chat-error-bg);
  border: 1px solid var(--chat-error-border);
  color: var(--chat-error-text);
  .error-icon { flex-shrink: 0; }
}

.typing-container { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
  padding-top: 0px; 
}

.processing-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0px;
  font-size: 14px;
  color: var(--chat-text-secondary);
  .spinner-icon {
    animation: spin 1s linear infinite;
    color: var(--chat-accent);
    font-size: 1.1em;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.empty-state {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  padding: $message-spacing;
}

.empty-state-content {
  text-align: center;
  max-width: 550px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-state-text {
  font-size: 16px;
  color: var(--chat-text-secondary);
  margin: 0;
  line-height: 1.6;
}

.input-area {
  padding: 16px $message-spacing;
  background-color: var(--chat-bg);
}

.message-form {
  max-width: 100%;
}

.input-container {
  display: flex;
  align-items: flex-end;
  background-color: var(--chat-bg-darker);
  border: 1px solid var(--chat-border);
  border-radius: $border-radius;
  transition: border-color $transition-speed ease;
  padding: 4px;
  &:focus-within {
    border-color: var(--chat-accent);
  }
}

.message-input {
  flex: 1;
  resize: none;
  background-color: transparent;
  border: none;
  color: var(--chat-text-primary);
  padding: 10px 12px;
  min-height: calc(1.5em + 20px);
  max-height: 150px; 
  font-size: 14px;
  line-height: 1.5;
  font-family: 'Inter', sans-serif;
  outline: none;
  &::placeholder {
    color: var(--chat-text-secondary);
    opacity: 0.8;
  }
  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--chat-scrollbar-thumb); border-radius: 3px; }
}

// Responsive font size for mobile
@media (max-width: 768px) {
  .message-input {
    font-size: 16px; // Prevent zoom on iOS
  }
}

/* .send-button CSS removed as the button is no longer in use
.send-button {
  background-color: $nosana-green;
  color: $nosana-dark; 
  border: none;
  padding: 0;
  width: 44px;
  height: 44px; 
  min-height: 44px;
  border-radius: calc(#{$border-radius} - 4px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  transition: background-color $transition-speed ease;
   &:hover:not(:disabled) {
    background-color: color.adjust($nosana-green, $lightness: 10%);
  }
  &:disabled {
    background-color: rgba($nosana-green, 0.4);
    color: rgba($nosana-dark, 0.7);
    cursor: not-allowed;
  }
}
*/

.initial-screen {
  display: flex;
  flex: 1;
  align-items: flex-start;
  justify-content: center;
  height: 100%;
  padding: $message-spacing;
  padding-top: 40%;
}

.initial-content {
  text-align: center;
  max-width: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  
  .title-container {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;

    .nosana-logo {
      width: 32px;
      height: 32px;
    }

    .model-title {
      margin: 0;
    }
  }
  
  .empty-state-text {
    margin-bottom: 0;
    margin-top: -8px;
  }
  
  .input-area {
    width: 100%;
    padding: 0;
    background-color: transparent;
  }
}

.active-chat-title-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.clear-chat-button {
  position: absolute;
  top: 16px;
  right: 20px;
  background-color: transparent !important;
  border-color: transparent !important;
  color: var(--chat-text-secondary) !important;
  
  &:hover {
    color: var(--chat-text-primary) !important;
  }
}

// Dark mode logo switching and thinking toggle improvement
html.dark-mode .nosana-chat-integrated {
  .thinking-toggle {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 8px 12px;
    margin: -8px -12px;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  }
}
</style> 