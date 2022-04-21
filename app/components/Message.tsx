import { useFetcher } from "@remix-run/react";
import { DateTime } from "luxon";
import { useState } from "react";
import { MessageWithUser } from "~/models/message.server";
import MessageForm from "./MessageForm";

type Props = {
  message: MessageWithUser;
  depth: number;
  allMessages?: MessageWithUser[];
};

export default function MessageComponent({
  message,
  depth,
  allMessages,
}: Props) {
  const fetcher = useFetcher();
  const createdAt = DateTime.fromISO(message!.createdAt.toString());
  const [showMessageForm, setShowMessageForm] = useState(false);

  const toggleForm = () => {
    setShowMessageForm((prevState) => !prevState);
  };

  const childMessages = allMessages
    ?.filter((m) => m?.parentId === message?.id)
    .reverse()
    .slice();

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
          <time
            className="text-neutral-200 italic"
            dateTime={createdAt.toISO()}
          >
            {createdAt.toRelative()}
          </time>
        </div>
        <div className="py-2 pl-12">{message!.text}</div>
        <div className="pl-12">
          {depth < 4 && (
            <button onClick={toggleForm} className="btn btn-primary btn-xs">
              Reply
            </button>
          )}
          <fetcher.Form method="post" className="inline">
            <input type="hidden" name="messageId" value={message!.id} />
            <input type="hidden" name="emoji" value="👍" />
            <button
              type="submit"
              className="btn btn-secondary btn-xs"
              name="_action"
              value="like"
            >
              👍
            </button>
          </fetcher.Form>
          <span>
            {message &&
              message.likes &&
              message.likes.length > 0 &&
              message.likes.map((like) => {
                return like?.user.username;
              })}
          </span>
        </div>
      </div>
      {showMessageForm && (
        <MessageForm
          id={message!.postId}
          parentId={message!.id}
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
