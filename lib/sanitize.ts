import sanitizeHtmlLib from "sanitize-html";

/**
 * Sanitizes HTML to prevent XSS attacks
 * Uses sanitize-html with a whitelist of safe tags and attributes
 */
export function sanitizeHtml(html: string): string {
  try {
    return sanitizeHtmlLib(html, {
      allowedTags: [
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
      allowedAttributes: {
        a: ["href", "title", "target", "rel"],
        img: ["src", "alt", "title", "width", "height"],
        code: ["class"],
        pre: ["class"],
        ol: ["start"],
        table: ["border"],
        th: ["align"],
        td: ["align", "colspan", "rowspan"],
        span: ["class"],
        div: ["class"],
        section: ["class"],
        article: ["class"],
      },
      allowedSchemes: ["http", "https", "data"],
      disallowedTagsMode: "discard",
    });
  } catch (error) {
    console.error("Error sanitizing HTML:", error);
    return html;
  }
}
