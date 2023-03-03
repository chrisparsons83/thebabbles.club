import type {
  DOMNode,
  Element,
  HTMLReactParserOptions,
} from "html-react-parser";
import { domToReact } from "html-react-parser";
import DOMPurify from "dompurify";
import MarkdownIt from "markdown-it";
import mila from "markdown-it-link-attributes";
import mis from "markdown-it-spoiler";
import Spoiler from "~/components/Spoiler";

const isElement = (domNode: DOMNode): domNode is Element => {
  const isTag = domNode.type === "tag";
  const hasAttributes = (domNode as Element).attribs !== undefined;

  return isTag && hasAttributes;
};

export function getFormattedMessageText(text: string) {
  const md = new MarkdownIt({ linkify: true, breaks: true });

  md.use(mila, {
    attrs: {
      target: "_blank",
      rel: "noopener noreferrer",
    },
  });

  md.use(mis);

  return md.render(DOMPurify.sanitize(text));
}

export const replaceOptions: HTMLReactParserOptions = {
  replace: (domNode) => {
    if (isElement(domNode) && domNode.attribs.class === "spoiler") {
      return <Spoiler>{domToReact(domNode.children, replaceOptions)}</Spoiler>;
    }
  },
};
