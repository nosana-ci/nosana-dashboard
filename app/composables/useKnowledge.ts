import { computed, ref, type Ref } from "vue";
import { embed, embedMany } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  deleteDoc,
  loadDocs,
  makeDoc,
  saveDoc,
  search,
  type KnowledgeDoc,
  type KnowledgeHit,
} from "~/utils/knowledgeBase";

export type EmbeddingAccess = {
  baseURL: string;
  apiKey: string;
  /** The gateway's embedding model, when one is serving. */
  model: string | null;
};

let shared: Ref<KnowledgeDoc[]> | null = null;
let loaded = false;

/**
 * The reader's documents, as the model's `search_knowledge` tool sees them.
 * Loaded once per page from IndexedDB and shared by every caller.
 */
export const useKnowledge = (access: () => EmbeddingAccess) => {
  shared ??= ref([]) as Ref<KnowledgeDoc[]>;
  const docs = shared;
  const busy = ref(false);
  const error = ref<string | null>(null);

  if (import.meta.client && !loaded) {
    loaded = true;
    loadDocs().then((list) => (docs.value = list.sort((a, b) => b.addedAt - a.addedAt)));
  }

  const embedder = () => {
    const { baseURL, apiKey, model } = access();
    if (!model) return null;
    return createOpenAICompatible({ name: "nosana", baseURL, apiKey }).embeddingModel(
      model,
    );
  };

  /** Adds a document; embeds its chunks when the gateway can, and carries on if not. */
  async function add(name: string, text: string) {
    const doc = makeDoc(name, text);
    if (!doc.chunks.length) return;
    busy.value = true;
    error.value = null;
    try {
      const model = embedder();
      if (model) {
        try {
          const { embeddings } = await embedMany({
            model,
            values: doc.chunks.map((chunk) => chunk.text),
          });
          doc.chunks.forEach((chunk, i) => (chunk.vector = embeddings[i]));
        } catch (cause) {
          // Lexical search still works; say so rather than refuse the document.
          error.value = `Added without embeddings: ${
            cause instanceof Error ? cause.message : String(cause)
          }`;
        }
      }
      await saveDoc(doc);
      docs.value = [doc, ...docs.value];
    } finally {
      busy.value = false;
    }
  }

  async function remove(id: string) {
    await deleteDoc(id);
    docs.value = docs.value.filter((doc) => doc.id !== id);
  }

  async function query(text: string, limit = 4): Promise<KnowledgeHit[]> {
    const model = embedder();
    let vector: number[] | null = null;
    if (model && docs.value.every((d) => d.chunks.every((c) => c.vector))) {
      try {
        vector = (await embed({ model, value: text })).embedding;
      } catch {
        vector = null;
      }
    }
    return search(docs.value, text, vector, limit);
  }

  const chunkCount = computed(() =>
    docs.value.reduce((sum, doc) => sum + doc.chunks.length, 0),
  );
  const semantic = computed(
    () => !!access().model && docs.value.every((d) => d.chunks.every((c) => c.vector)),
  );

  return { docs, busy, error, chunkCount, semantic, add, remove, query };
};
