import Autolinker from "autolinker";
import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";

export function getFormattedMessageText(text: string) {
  const md = new MarkdownIt();
  return Autolinker.link(md.render(DOMPurify.sanitize(text)));
}
