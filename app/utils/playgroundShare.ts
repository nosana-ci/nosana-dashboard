import type { ModelUIMessage } from "~/utils/modelTransport";

/**
 * A conversation as a link: the messages, gzipped and base64url-encoded into the
 * URL fragment, so nothing is stored anywhere but the link itself.
 */
const PARAM = "share=";

const toBase64Url = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const fromBase64Url = (text: string): Uint8Array => {
  const padded = text.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

async function pipe(bytes: Uint8Array, stream: GenericTransformStream) {
  const result = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(result).arrayBuffer());
}

export async function encodeShare(
  title: string,
  messages: ModelUIMessage[],
): Promise<string> {
  const json = JSON.stringify({ title, messages });
  const packed = await pipe(
    new TextEncoder().encode(json),
    new CompressionStream("gzip"),
  );
  return `#${PARAM}${toBase64Url(packed)}`;
}

export async function decodeShare(
  hash: string,
): Promise<{ title: string; messages: ModelUIMessage[] } | null> {
  const index = hash.indexOf(PARAM);
  if (index < 0) return null;
  try {
    const bytes = await pipe(
      fromBase64Url(hash.slice(index + PARAM.length)),
      new DecompressionStream("gzip"),
    );
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(parsed?.messages)) return null;
    return { title: String(parsed.title ?? ""), messages: parsed.messages };
  } catch {
    return null;
  }
}
