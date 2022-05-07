import Autolinker from "autolinker";
import DOMPurify from "dompurify";

export function getFormattedMessageText(text: string) {
  return Autolinker.link(DOMPurify.sanitize(text));
}
