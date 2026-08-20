<template>
  <div>
    <TopBar
      title="Agentic AI Configuration"
      subtitle="Connect your IDE to Nosana MCP"
    />
    
    <div class="box has-background-white-ter">
      <div class="columns is-centered">
        <div class="column is-8">
          <div class="box">
            <h4 class="title is-4">IDE Integration</h4>
            <p class="is-size-5 mb-4">
              Add the following configuration to your <code>claude_desktop_config.json</code> or your Cursor MCP settings. 
              Replace <code>"their_api_key"</code> with your actual Nosana API Key to allow your AI agents to interact with your deployments.
            </p>
            
            <div style="position: relative;">
              <pre style="background-color: #1e1e1e !important; color: #d4d4d4 !important; border-radius: 8px; padding: 1.5rem; overflow-x: auto; margin-bottom: 0;"><code class="is-family-code" style="color: inherit;">{
  <span style="color: #9cdcfe;">"mcpServers"</span>: {
    <span style="color: #9cdcfe;">"nosana"</span>: {
      <span style="color: #9cdcfe;">"command"</span>: <span style="color: #ce9178;">"npx"</span>,
      <span style="color: #9cdcfe;">"args"</span>: [
        <span style="color: #ce9178;">"nosana-deployment-mcp"</span>
      ],
      <span style="color: #9cdcfe;">"env"</span>: {
        <span style="color: #9cdcfe;">"NOSANA_API_KEY"</span>: <span style="color: #ce9178;">"their_api_key"</span>
      }
    }
  }
}</code></pre>
              <button 
                class="button is-small" 
                :class="copied ? 'is-success' : 'is-dark'"
                style="position: absolute; top: 12px; right: 12px; border: 1px solid #444;" 
                @click="copySnippet"
              >
                <span class="icon is-small">
                  <i :class="copied ? 'fas fa-check' : 'far fa-copy'"></i>
                </span>
                <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const copied = ref(false);

const snippet = `{
  "mcpServers": {
    "nosana": {
      "command": "npx",
      "args": [
        "nosana-deployment-mcp"
      ],
      "env": {
        "NOSANA_API_KEY": "their_api_key"
      }
    }
  }
}`;

const copySnippet = async () => {
  try {
    await navigator.clipboard.writeText(snippet);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};
</script>

<style scoped>
pre code span {
  font-weight: 500;
}
</style>
