import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";

export function getFormattedMessageText(text: string) {
  const md = new MarkdownIt({ linkify: true, breaks: true });
  return md.render(DOMPurify.sanitize(text));
}
