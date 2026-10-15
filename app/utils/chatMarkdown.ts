import DOMPurify from "dompurify";
import katex from "katex";
import { Marked, type TokenizerAndRendererExtension } from "marked";
import "katex/dist/katex.min.css";

type MathToken = { type: string; raw: string; text: string; display: boolean };

/**
 * Maths as models write it: `\( … \)` inline, `\[ … \]` or `$$ … $$` set apart. A single
 * `$` is left alone, since in a chat about GPU prices it is nearly always money.
 */
const MATH = /^(?:\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$)/;

const math = (level: "block" | "inline"): TokenizerAndRendererExtension => ({
  name: `${level}Math`,
  level,
  start: (src) => src.search(level === "block" ? /\\\[|\$\$/ : /\\\(|\\\[|\$\$/),
  tokenizer(src) {
    const match = MATH.exec(src);
    if (!match || (level === "block" && match[1] !== undefined)) return undefined;
    const [raw, inline, bracket, dollars] = match;
    return { type: `${level}Math`, raw, text: (inline ?? bracket ?? dollars)!.trim(), display: inline === undefined };
  },
  renderer: (token) => {
    const { text, display } = token as unknown as MathToken;
    return katex.renderToString(text, { displayMode: display, throwOnError: false });
  },
});

const markdown = new Marked({ gfm: true, breaks: true }).use({
  extensions: [math("block"), math("inline")],
});

/**
 * A model's reply as sanitised HTML for Bulma's `.content`. Links open in a new tab;
 * anything else a model writes is untrusted, so DOMPurify strips scripts and handlers.
 */
export const renderChatMarkdown = (text: string): string =>
  DOMPurify.sanitize(
    (markdown.parse(text, { async: false }) as string).replace(
      /<a /g,
      '<a target="_blank" rel="noopener noreferrer" ',
    ),
    { ADD_ATTR: ["target"] },
  );
