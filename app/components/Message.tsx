import clsx from "clsx";
import parse from "html-react-parser";
import { useEffect, useState } from "react";
import ReactTimeAgo from "react-time-ago";
import { useBabblesContext } from "~/babblesContext";
import { getFormattedMessageText } from "~/lib/format";
import { Image, Transformation } from "cloudinary-react";

import type { MessageWithUser } from "~/models/message.server";
import ImagePreview from "./ImagePreview";
import LikeButton from "./LikeButton";
import MessageForm from "./MessageForm";

type Props = {
  message: NonNullable<MessageWithUser>;
  depth: number;
  allMessages?: MessageWithUser[];
  pageLoadTime: Date;
  cloudName?: string;
};

function getAvatarCloudinaryId(url: string | null) {
  if (!url) return null;

  const urlParts = url.split("/");
  return urlParts.slice(-2).join("/");
}

const getImagesFromString = (text: string, numberToShow: number = 1) => {
  const regex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|gifv|webm|webp))"/gi;
  const matches = text.match(regex);
  if (!matches) return [];
  return [
    ...new Set(matches.map((match) => match.trim().replace('"', ""))),
  ].slice(0, numberToShow);
};

const depthTheming = [
  ["border-gray-900", "dark:border-gray-100"],
  ["border-gray-800", "dark:border-gray-200"],
  ["border-gray-700", "dark:border-gray-300"],
  ["border-gray-600", "dark:border-gray-400"],
  ["border-gray-500", "dark:border-gray-500"],
  ["border-gray-400", "dark:border-gray-600"],
  ["border-gray-300", "dark:border-gray-700"],
  ["border-gray-200", "dark:border-gray-800"],
  ["border-gray-100", "dark:border-gray-900"],
];

export default function MessageComponent({
  message,
  depth,
  allMessages,
  pageLoadTime,
  cloudName,
}: Props) {
  const newerThanInitialLoad = new Date(message.createdAt) > pageLoadTime;
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [hasNotBeenViewed, setHasNotBeenViewed] =
    useState(newerThanInitialLoad);
  const { user } = useBabblesContext();

  useEffect(() => {
    setHasNotBeenViewed(newerThanInitialLoad);
  }, [newerThanInitialLoad]);

  const handleMouseover = () => {
    setHasNotBeenViewed(false);
  };

  const toggleForm = () => {
    setShowMessageForm((prevState) => !prevState);
  };

  const toggleEditForm = () => {
    setShowEditForm((prevState) => !prevState);
    setShowMessageForm((prevState) => !prevState);
  };

  const resetButtons = () => {
    setShowEditForm(false);
    setShowMessageForm(false);
  };

  const childMessages = allMessages
    ?.filter((m) => m?.parentId === message?.id)
    .reverse()
    .slice();

  if (!user) return null;

  const isWrittenByCurrentUser = message.userId === user?.id;
  const messageDate = new Date(message.createdAt);
  const formattedMessage = getFormattedMessageText(message.text);
  const imagesToDisplay = getImagesFromString(formattedMessage);
  const borderTheme = depthTheming[depth];
  const avatarToDisplay =
    message.user.avatar || "https://via.placeholder.com/32";
  const cloudinaryAvatarId = getAvatarCloudinaryId(message.user.avatar);

  return (
    <div
      className={clsx(
        borderTheme,
        "border-l-4",
        "lg:border-l-8",
        "pt-4",
        depth === 0 ? ["mb-8"] : "",
        hasNotBeenViewed ? "bg-primary" : "",
        "duration-500"
      )}
      onMouseOver={handleMouseover}
    >
      <div className="border-b border-secondary px-4 pb-4">
        <div className="mb-3 flex">
          <div className="not-prose avatar mr-2 flex-none">
            <div className="not-prose w-8 rounded">
              {cloudinaryAvatarId && cloudName ? (
                <Image cloudName={cloudName} publicId={cloudinaryAvatarId}>
                  <Transformation
                    height="64"
                    quality="auto:best"
                    width="64"
                    crop="fill"
                  />
                </Image>
              ) : (
                <img src={avatarToDisplay} alt="" />
              )}
            </div>
          </div>
          <div className="flex-none">
            <span className="font-bold">{message!.user.username}</span>
            {" ∙ "}
            <span className="text-xs font-light italic">
              <ReactTimeAgo
                date={messageDate}
                locale="en-US"
                timeStyle="round-minute"
              />
            </span>
          </div>
        </div>
        <div>
          <div className="my-6 break-words">{parse(formattedMessage)}</div>
          <div className="">
            {imagesToDisplay.map((image) => (
              <ImagePreview
                image={image}
                key={image}
                showOnInitialLoad={newerThanInitialLoad}
              />
            ))}
          </div>
          <div className="mt-4 flex gap-0.5">
            {depth < 8 && (
              <button
                onClick={toggleForm}
                className="btn btn-secondary btn-sm flex-none"
                disabled={showEditForm}
              >
                Reply
              </button>
            )}
            {isWrittenByCurrentUser && (
              <button
                onClick={toggleEditForm}
                className="btn btn-secondary btn-sm flex-none"
                disabled={showMessageForm && !showEditForm}
              >
                Edit
              </button>
            )}
            <LikeButton message={message} emoji="👍" />
            <LikeButton message={message} emoji="👎" />
          </div>

          {message && showMessageForm && (
            <MessageForm
              id={message.postId}
              parentId={message.id}
              toggleForm={resetButtons}
              existingMessage={showEditForm ? message : undefined}
            />
          )}
        </div>
      </div>
      {childMessages &&
        childMessages.length > 0 &&
        childMessages.map(
          (message) =>
            message && (
              <div className={clsx("pl-1")} key={message!.id}>
                <MessageComponent
                  message={message}
                  depth={depth + 1}
                  allMessages={allMessages}
                  pageLoadTime={pageLoadTime}
                />
              </div>
            )
        )}
    </div>
  );
}
