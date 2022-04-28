import parse from "html-react-parser";
import { useState } from "react";
import ReactTimeAgo from "react-time-ago";

import type { MessageWithUser } from "~/models/message.server";
import ImagePreview from "./ImagePreview";
import LikeButton from "./LikeButton";
import MessageForm from "./MessageForm";

type Props = {
  message: MessageWithUser;
  depth: number;
  allMessages?: MessageWithUser[];
};

const getImagesFromString = (text: string, numberToShow: number = 1) => {
  const regex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|gifv))"/gi;
  const matches = text.match(regex);
  if (!matches) return [];
  return [...new Set(matches.map((match) => match.trim().replace('"', "")))];
};

export default function MessageComponent({
  message,
  depth,
  allMessages,
}: Props) {
  const [showMessageForm, setShowMessageForm] = useState(false);

  const toggleForm = () => {
    setShowMessageForm((prevState) => !prevState);
  };

  const childMessages = allMessages
    ?.filter((m) => m?.parentId === message?.id)
    .reverse()
    .slice();

  if (!message) return null;

  const messageDate = new Date(message.createdAt);
  const imagesToDisplay = getImagesFromString(message.text);

  return (
    <div>
      <div className="py-6">
        <div>
          <div className="avatar">
            <div className="ml-4 mr-2 w-6 rounded">
              <img
                src="https://api.lorem.space/image/face?hash=83692"
                alt="face"
              />
            </div>
          </div>
          <span className="font-bold">{message!.user.username}</span>{" "}
          <ReactTimeAgo
            date={messageDate}
            locale="en-US"
            timeStyle="round-minute"
          />
        </div>
        <div className="break-words py-2 pl-12">{parse(message.text)}</div>
        <div className="pl-12">
          {imagesToDisplay.map((image) => (
            <ImagePreview image={image} key={image} />
          ))}
        </div>
        <div className="mt-2 flex gap-4 pl-12">
          {depth < 4 && (
            <button
              onClick={toggleForm}
              className="btn btn-primary btn-sm flex-none"
            >
              Reply
            </button>
          )}
          <LikeButton message={message} emoji="👍" />
          <LikeButton message={message} emoji="👎" />
        </div>
      </div>
      {message && showMessageForm && (
        <MessageForm
          id={message.postId}
          parentId={message.id}
          toggleForm={toggleForm}
        />
      )}
      {childMessages &&
        childMessages.length > 0 &&
        childMessages.map((message) => (
          <div
            className="border-l-8 border-gray-200 bg-neutral"
            key={message!.id}
          >
            <MessageComponent
              message={message}
              depth={depth + 1}
              allMessages={allMessages}
            />
          </div>
        ))}
    </div>
  );
}
