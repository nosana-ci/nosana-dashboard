/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
 * Used to secure the authorization code flow by preventing authorization code interception attacks
 */

/**
 * Generates a random code verifier string for PKCE
 * @returns A random string between 43 and 128 characters
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(56); // 56 bytes = 448 bits, well within the 43-128 character range after base64 encoding
  crypto.getRandomValues(array);
  return base64URLEncode(array);
}

/**
 * Creates a code challenge from a code verifier using SHA-256
 * @param verifier The code verifier to hash
 * @returns A base64URL-encoded SHA-256 hash of the verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(new Uint8Array(digest));
}

/**
 * Encodes a buffer as base64URL
 * Base64URL is similar to base64 but uses URL-safe characters:
 * - Replaces '+' with '-'
 * - Replaces '/' with '_'
 * - Removes padding '='
 */
function base64URLEncode(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
} 