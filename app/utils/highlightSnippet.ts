import { escapeHtml } from "~/utils/htmlSanitization";

/** Keywords of the snippet languages (JavaScript, Python), coloured as such. */
const KEYWORDS = ["import", "from", "export", "const", "let", "await", "async", "for", "of", "in", "return", "new", "def", "with", "as"];

/**
 * A code snippet as HTML: the values the reader has to supply (a key, an endpoint)
 * in `<mark>`, strings and numbers in `.tok-s`, whole-line comments in `.tok-c`,
 * keywords in `.tok-k` and function calls in `.tok-f`.
 * Supplied values usually sit inside a string, so strings are painted a second time.
 */
export function highlightSnippet(code: string, supplied: (string | null | undefined)[]): string {
  const values = supplied
    .filter((value): value is string => !!value)
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  const paint = (text: string, pattern: RegExp, wrap: (match: RegExpMatchArray) => string) => {
    let html = "";
    let last = 0;
    for (const match of text.matchAll(pattern)) {
      html += escapeHtml(text.slice(last, match.index)) + wrap(match);
      last = match.index + match[0].length;
    }
    return html + escapeHtml(text.slice(last));
  };
  const mark = (text: string) =>
    values ? paint(text, new RegExp(values, "g"), (m) => `<mark>${escapeHtml(m[0])}</mark>`) : escapeHtml(text);

  // A value that matches nothing keeps the first group from matching empty strings.
  return paint(
    code,
    new RegExp(
      `(${values || "(?!)"})|("(?:[^"\\\\\\n]|\\\\.)*")|(^[ \\t]*(?:\\/\\/|#)[^\\n]*)|\\b(${KEYWORDS.join("|")})\\b|\\b([A-Za-z_]\\w*)(?=\\()|\\b\\d+(?:\\.\\d+)?\\b`,
      "gm",
    ),
    (m) => {
      if (m[1]) return mark(m[0]);
      if (m[2]) return `<span class="tok-s">${mark(m[0])}</span>`;
      if (m[3]) return `<span class="tok-c">${escapeHtml(m[0])}</span>`;
      if (m[4]) return `<span class="tok-k">${m[0]}</span>`;
      if (m[5]) return `<span class="tok-f">${m[0]}</span>`;
      return `<span class="tok-s">${m[0]}</span>`;
    },
  );
}
