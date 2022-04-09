import { DateTime } from "luxon";
import { Message } from "~/models/message.server";

type Props = {
  message: Message;
  depth: number;
};

export default function MessageComponent({ message }: Props) {
  const createdAt = DateTime.fromISO(message.createdAt.toString());
  console.log(message.createdAt);
  console.log(createdAt);

  return (
    <div className="py-4">
      <div>
        <div className="avatar">
          <div className="w-6 rounded">
            <img
              src="https://api.lorem.space/image/face?hash=83692"
              alt="face"
            />
          </div>
        </div>
        <span>Person's name</span>{" "}
        <time dateTime={createdAt.toISO()}>at {createdAt.toRelative()}</time>
      </div>
      <div className="pl-8">{message.text}</div>
    </div>
  );
}
