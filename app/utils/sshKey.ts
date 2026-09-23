// Display helpers for a single OpenSSH public key line:
//   "<algorithm> <base64 body> [comment]"

export interface SshKeyParts {
  algorithm: string;
  body: string;
  comment: string;
}

export function parseSshKeyParts(key: string): SshKeyParts {
  const [algorithm = "", body = "", ...comment] = key.trim().split(/\s+/);
  return { algorithm, body, comment: comment.join(" ") };
}

// "ssh-ed25519" → "ED25519", compact enough for a badge.
export function sshKeyAlgorithmLabel(key: string): string {
  return parseSshKeyParts(key).algorithm.replace(/^ssh-/, "").toUpperCase();
}

// The comment when there is one, otherwise a positional fallback.
export function sshKeyLabel(key: string, index: number): string {
  return parseSshKeyParts(key).comment || `SSH key ${index + 1}`;
}

// Head and tail of the key material, enough to tell two keys apart.
export function shortenSshKeyBody(key: string): string {
  const { body } = parseSshKeyParts(key);
  return body.length > 40 ? `${body.slice(0, 20)}…${body.slice(-12)}` : body;
}
