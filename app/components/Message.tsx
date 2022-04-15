import { DateTime } from "luxon";
import { useState } from "react";
import { Message } from "~/models/message.server";
import { User } from "~/models/user.server";
import MessageForm from "./MessageForm";

type MessageAndUser = Message & {
  user: User;
};

type Props = {
  message: MessageAndUser;
  depth: number;
  childMessages?: MessageAndUser[];
};

export default function MessageComponent({
  message,
  depth,
  childMessages,
}: Props) {
  const createdAt = DateTime.fromISO(message.createdAt.toString());
  const [showMessageForm, setShowMessageForm] = useState(false);

  const toggleForm = () => {
    setShowMessageForm((prevState) => !prevState);
  };

  return (
    <div className="py-4">
      <div>
        <div className="avatar">
          <div className="mr-2 w-6 rounded">
            <img
              src="https://api.lorem.space/image/face?hash=83692"
              alt="face"
            />
          </div>
        </div>
        <span className="font-bold">{message.user.username}</span>{" "}
        <time className="text-neutral-200 italic" dateTime={createdAt.toISO()}>
          {createdAt.toRelative()}
        </time>
      </div>
      <div className="pl-8">{message.text}</div>
      <div className="pl-8">
        Like | <button onClick={toggleForm}>Reply</button>
      </div>
      {showMessageForm && (
        <MessageForm id={message.postId} parentId={message.id} />
      )}
      {childMessages &&
        childMessages.length > 0 &&
        childMessages.map((message) => (
          <div className="border-r-4 border-white bg-neutral" key={message.id}>
            <MessageComponent message={message} depth={depth + 1} />
          </div>
        ))}
    </div>
  );
}
