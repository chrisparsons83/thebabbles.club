import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useSocket } from "~/context";
import { Like } from "~/models/like.server";
import { MessageWithUser } from "~/models/message.server";

type Props = {
  message: MessageWithUser;
  emoji: string;
};

export default function LikeButton({ message, emoji }: Props) {
  const fetcher = useFetcher<Like>();
  const [lastState, setLastState] = useState("");
  const socket = useSocket();

  useEffect(() => {
    if (fetcher.state === "loading" && lastState !== "submitting" && socket) {
      console.log("like posted");
      console.log(fetcher.data);
      // socket.emit("likePosted", fetcher.data.message);
    }

    setLastState(fetcher.state);
  }, [fetcher.data, fetcher.state, lastState, socket]);

  return (
    <>
      <fetcher.Form method="post" className="inline">
        <input type="hidden" name="messageId" value={message!.id} />
        <input type="hidden" name="emoji" value={emoji} />
        <button
          type="submit"
          className="btn btn-secondary btn-xs"
          name="_action"
          value="like"
        >
          {emoji}
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
    </>
  );
}
