import { DateTime } from "luxon";
import { Message } from "~/models/message.server";
import { User } from "~/models/user.server";

type Props = {
  message: Message & {
    user: User;
  };
  depth: number;
};

export default function MessageComponent({ message }: Props) {
  const createdAt = DateTime.fromISO(message.createdAt.toString());

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
    </div>
  );
}
