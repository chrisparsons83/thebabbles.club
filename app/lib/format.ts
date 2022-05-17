import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";
import mila from "markdown-it-link-attributes";

export function getFormattedMessageText(text: string) {
  const md = new MarkdownIt({ linkify: true, breaks: true });

  md.use(mila, {
    attrs: {
      target: "_blank",
      rel: "noopener noreferrer",
    },
  });

  return md.render(DOMPurify.sanitize(text));
}
