import DOMPurify from "dompurify";

/**
 * Decode HTML entities and strip all tags so translations / tafsir
 * never leak raw <sup>, <i>, &lt;br&gt;, footnote markers etc.
 * Returns plain readable text.
 */
export function toCleanText(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input);
  // Decode entities repeatedly (handles double-encoded strings)
  for (let i = 0; i < 3; i++) {
    const decoded = decodeEntities(s);
    if (decoded === s) break;
    s = decoded;
  }
  // Remove footnote sup blocks entirely (with content)
  s = s.replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "");
  // Strip all remaining tags
  s = s.replace(/<[^>]+>/g, "");
  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

function decodeEntities(s: string): string {
  if (typeof window === "undefined") {
    return s
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&");
  }
  const el = document.createElement("textarea");
  el.innerHTML = s;
  return el.value;
}

/**
 * Sanitized HTML for tafsir where we want to keep paragraph structure
 * but drop footnote markers and dangerous tags.
 */
export function toCleanHtml(input: string | null | undefined): string {
  if (!input) return "";
  let s = String(input);
  for (let i = 0; i < 3; i++) {
    const decoded = decodeEntities(s);
    if (decoded === s) break;
    s = decoded;
  }
  s = s.replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "");
  return DOMPurify.sanitize(s, {
    ALLOWED_TAGS: ["p", "br", "em", "strong", "b", "i", "u", "span", "div"],
    ALLOWED_ATTR: ["dir", "lang"],
  });
}
