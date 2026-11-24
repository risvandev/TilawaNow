import sanitizeHtml from "sanitize-html";

export function sanitizeQuranMarkup(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "div", "span", "b", "strong", "i", "em", "u", "sup", "sub", "ol", "ul", "li", "blockquote", "h2", "h3", "h4", "h5", "a"],
    allowedAttributes: { a: ["href"], "*": ["dir", "lang"] },
    allowedSchemes: ["https", "http"],
    allowProtocolRelative: false,
  });
}

export function sanitizeTajweedMarkup(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["rule"],
    allowedAttributes: { rule: ["class"] },
  });
}
