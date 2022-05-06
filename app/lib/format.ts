import Autolinker from "autolinker";
import DOMPurify from "dompurify";
import snarkdown from "snarkdown";

export function getFormattedMessageText(text: string) {
  return snarkdown(Autolinker.link(DOMPurify.sanitize(text)));
}
