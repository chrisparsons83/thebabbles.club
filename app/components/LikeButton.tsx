import { useFetcher } from "@remix-run/react";
import { useEffect, useState } from "react";
import { useSocket } from "~/context";
import type { LikeWithUser } from "~/models/like.server";
import type { MessageWithUser } from "~/models/message.server";

type Props = {
  message: MessageWithUser;
  emoji: string;
};

type FetcherData = {
  like: LikeWithUser;
};

export default function LikeButton({ message, emoji }: Props) {
  const fetcher = useFetcher<FetcherData>();
  const [lastState, setLastState] = useState("");
  const socket = useSocket();

  useEffect(() => {
    if (
      fetcher.data &&
      fetcher.state === "loading" &&
      lastState !== "submitting" &&
      socket
    ) {
      socket.emit("likePosted", fetcher.data.like);
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
      <div className="avatar-group -space-x-6">
        {message &&
          message.likes &&
          message.likes.length > 0 &&
          message.likes.map((like) => {
            if (!like) return null;
            const { user } = like;
            if (user.avatar) {
              <div className="avatar" key={like.id}>
                <div className="w-12">
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="tooltip"
                    data-tip={user.username}
                  />
                </div>
              </div>;
            }
            return (
              <div className="avatar placeholder" key={like.id}>
                <div className="w-12 rounded-full bg-neutral-focus text-neutral-content">
                  <span className="tooltip" data-tip={user.username}>
                    {user.username.slice(0, 1).toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
}
