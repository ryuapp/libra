import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes HTML to prevent XSS attacks
 * Uses isomorphic-dompurify for server-side and client-side compatibility
 */
export function sanitizeHtml(html: string): string {
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        // Text formatting
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "del",
        "ins",
        // Code
        "code",
        "pre",
        // Headings
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        // Lists
        "ul",
        "ol",
        "li",
        // Quotes
        "blockquote",
        // Links and images
        "a",
        "img",
        // Horizontal rule
        "hr",
        // Tables
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        // Containers
        "span",
        "div",
        "section",
        "article",
      ],
      ALLOWED_ATTR: [
        "href",
        "title",
        "target",
        "rel",
        "src",
        "alt",
        "width",
        "height",
        "class",
        "start",
        "border",
        "align",
        "colspan",
        "rowspan",
      ],
      ALLOW_DATA_ATTR: false,
      KEEP_CONTENT: true,
    });
  } catch (error) {
    console.error("Error sanitizing HTML:", error);
    return html;
  }
}
