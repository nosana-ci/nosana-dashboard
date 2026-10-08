<template>
  <div class="nosa section-card">
    <div class="nosa-bar">
      <div>
        <h3 class="title is-6 mb-0">Nosa</h3>
        <p class="is-size-7 has-text-grey">Answers questions and manages deployments on your account</p>
      </div>
      <button type="button" class="button is-small is-quiet" :disabled="!history.length" @click="reset">
        New chat
      </button>
    </div>

    <div ref="scroller" class="nosa-msgs" aria-live="polite">
      <p v-if="!items.length && !live" class="has-text-grey">
        Ask about Nosana, your deployments or credits, or ask Nosa to deploy something for you.
      </p>

      <template v-for="(item, i) in items" :key="i">
        <div v-if="item.kind === 'user'" class="nosa-user">{{ item.text }}</div>
        <div v-else-if="item.kind === 'text'" class="content" v-html="render(item.text)" />
        <p v-else-if="item.kind === 'tool'" class="is-size-7 has-text-grey">
          {{ STEP[item.state] }} {{ toolLabel(item.name) }}
        </p>
        <div v-else class="box nosa-approval">
          <p class="has-text-weight-semibold">{{ toolLabel(item.name) }}</p>
          <pre class="nosa-input">{{ JSON.stringify(item.input, null, 2) }}</pre>
          <div v-if="item.state === 'pending'" class="buttons mt-3 mb-0">
            <button type="button" class="button is-success is-small" :disabled="busy" @click="answer(item.approvalId, true)">
              Confirm
            </button>
            <button type="button" class="button is-small" :disabled="busy" @click="answer(item.approvalId, false)">
              Cancel
            </button>
          </div>
          <p v-else class="is-size-7 has-text-grey mt-2">
            {{ item.state === "approved" ? "Confirmed" : "Cancelled" }}
          </p>
        </div>
      </template>

      <template v-if="live">
        <p v-for="step in live.steps" :key="step.callId" class="is-size-7 has-text-grey">
          {{ STEP[step.state] }} {{ toolLabel(step.name) }}
        </p>
        <div v-if="live.text" class="content" v-html="render(live.text)" />
        <p v-else class="has-text-grey">…</p>
      </template>

      <p v-if="error" class="has-text-danger">{{ error }}</p>
    </div>

    <form class="nosa-composer" @submit.prevent="submit">
      <textarea
        v-model="draft"
        class="textarea"
        rows="2"
        :placeholder="pending ? 'Confirm or cancel above, or tell Nosa what to change' : 'Message Nosa'"
        :disabled="busy"
        @keydown.enter.exact.prevent="submit"
      />
      <button type="submit" class="button is-dark" :disabled="!busy && !draft.trim()">
        {{ busy ? "Stop" : "Send" }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { Marked } from "marked";
import DOMPurify from "dompurify";
import { buildView, toolLabel } from "~/utils/nosaChat";

const { history, live, busy, error, pending, send, answer, stop, reset } = useNosa();

const STEP = { running: "…", done: "✓", failed: "✗", declined: "–" } as const;

const items = computed(() => buildView(history.value));
const draft = ref("");

function submit() {
  if (busy.value) return stop();
  const text = draft.value.trim();
  if (!text) return;
  draft.value = "";
  void send(text);
}

const markdown = new Marked({ gfm: true, breaks: true });
// Replies can echo text from tool results such as job logs, so images are dropped:
// a remote image URL could carry data out of the page.
const render = (text: string) =>
  DOMPurify.sanitize(
    (markdown.parse(text, { async: false }) as string).replace(
      /<a /g,
      '<a target="_blank" rel="noopener noreferrer" ',
    ),
    { ADD_ATTR: ["target"], FORBID_TAGS: ["img"] },
  );

const scroller = ref<HTMLElement | null>(null);
watch(
  [items, () => live.value?.text, () => live.value?.steps.length],
  async () => {
    await nextTick();
    scroller.value?.scrollTo({ top: scroller.value.scrollHeight });
  },
  { immediate: true },
);
</script>

<style scoped lang="scss">
.nosa {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 1rem 1.15rem;
}

.nosa-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.75rem;

  .title {
    color: inherit;
  }
}

.nosa-msgs {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.5rem 0;
}

.nosa-user {
  align-self: flex-end;
  max-width: 80%;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  background: rgba($black, 0.05);
  white-space: pre-wrap;
}

html.dark-mode .nosa-user {
  background: rgba($white, 0.08);
}

.nosa-approval {
  margin-bottom: 0;
}

.nosa-input {
  max-height: 14rem;
  overflow: auto;
  margin-top: 0.5rem;
  font-size: 0.75rem;
}

.nosa-composer {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  padding-top: 0.75rem;
}
</style>
