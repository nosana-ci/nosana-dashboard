/**
 * A knowledge base that lives in the browser: documents the reader adds, split
 * into chunks and kept in IndexedDB. Search is lexical, so it works with no
 * model at all; when the gateway serves an embedding model, chunks are embedded
 * and the search becomes semantic.
 */
export type KnowledgeChunk = {
  id: string;
  text: string;
  vector?: number[];
};

export type KnowledgeDoc = {
  id: string;
  name: string;
  addedAt: number;
  size: number;
  chunks: KnowledgeChunk[];
};

export type KnowledgeHit = {
  docId: string;
  name: string;
  text: string;
  score: number;
};

const DB = "playground-knowledge";
const STORE = "docs";
const CHUNK = 1200;
const OVERLAP = 160;

const newId = () => Math.random().toString(36).slice(2, 10);

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function run<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const request = action(db.transaction(STORE, mode).objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export const loadDocs = (): Promise<KnowledgeDoc[]> =>
  run("readonly", (store) => store.getAll() as IDBRequest<KnowledgeDoc[]>);

export const saveDoc = (doc: KnowledgeDoc) =>
  run("readwrite", (store) => store.put(doc));

export const deleteDoc = (id: string) =>
  run("readwrite", (store) => store.delete(id));

/** Paragraph-aware chunks of about a thousand characters, with a little overlap. */
export function chunkText(text: string): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + CHUNK, clean.length);
    if (end < clean.length) {
      const breakAt = clean.lastIndexOf("\n\n", end);
      if (breakAt > start + CHUNK / 2) end = breakAt;
      else {
        const sentence = clean.lastIndexOf(". ", end);
        if (sentence > start + CHUNK / 2) end = sentence + 1;
      }
    }
    chunks.push(clean.slice(start, end).trim());
    if (end >= clean.length) break;
    start = Math.max(end - OVERLAP, start + 1);
  }
  return chunks.filter(Boolean);
}

export function makeDoc(name: string, text: string): KnowledgeDoc {
  return {
    id: newId(),
    name,
    addedAt: Date.now(),
    size: text.length,
    chunks: chunkText(text).map((chunk) => ({ id: newId(), text: chunk })),
  };
}

const tokens = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length > 1);

/** Lexical ranking: term frequency, rarer terms weighing more; plain and quick. */
function lexicalSearch(
  docs: KnowledgeDoc[],
  query: string,
  limit: number,
): KnowledgeHit[] {
  const terms = [...new Set(tokens(query))];
  if (!terms.length) return [];
  const all = docs.flatMap((doc) =>
    doc.chunks.map((chunk) => ({ doc, chunk, words: tokens(chunk.text) })),
  );
  const df = new Map<string, number>();
  for (const term of terms) {
    df.set(term, all.filter((entry) => entry.words.includes(term)).length);
  }
  const hits = all
    .map((entry) => {
      let score = 0;
      for (const term of terms) {
        const count = entry.words.filter((w) => w === term).length;
        if (!count) continue;
        const idf = Math.log(1 + all.length / (df.get(term) ?? 1));
        score += (count / Math.sqrt(entry.words.length)) * idf;
      }
      return { docId: entry.doc.id, name: entry.doc.name, text: entry.chunk.text, score };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

const cosine = (a: number[], b: number[]): number => {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
};

/** Semantic ranking when every chunk carries a vector, lexical otherwise. */
export function search(
  docs: KnowledgeDoc[],
  query: string,
  queryVector: number[] | null,
  limit = 4,
): KnowledgeHit[] {
  const embedded = docs.length > 0 && docs.every((d) => d.chunks.every((c) => c.vector));
  if (!queryVector || !embedded) return lexicalSearch(docs, query, limit);
  return docs
    .flatMap((doc) =>
      doc.chunks.map((chunk) => ({
        docId: doc.id,
        name: doc.name,
        text: chunk.text,
        score: cosine(queryVector, chunk.vector!),
      })),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
