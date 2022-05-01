import { useFetcher } from "@remix-run/react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useBabblesContext } from "~/babblesContext";
import { useSocket } from "~/context";
import type { LikeWithUser } from "~/models/like.server";
import type { MessageWithUser } from "~/models/message.server";

type Props = {
  message: MessageWithUser;
  emoji: string;
};

type FetcherData = {
  like?: LikeWithUser;
  unlike?: LikeWithUser;
};

export default function LikeButton({ message, emoji }: Props) {
  const fetcher = useFetcher<FetcherData>();
  const [lastState, setLastState] = useState("");
  const socket = useSocket();
  const { user } = useBabblesContext();

  useEffect(() => {
    if (
      fetcher.data &&
      fetcher.state === "loading" &&
      lastState !== "submitting" &&
      socket
    ) {
      if (fetcher.data.like) {
        socket.emit("likePosted", fetcher.data.like);
      }
      if (fetcher.data.unlike) {
        socket.emit("unlikePosted", fetcher.data.unlike);
      }
    }

    setLastState(fetcher.state);
  }, [fetcher.data, fetcher.state, lastState, socket]);

  if (!message) return null;

  const filteredLikesByEmoji = message.likes.filter(
    (like) => like.emoji === emoji
  );
  const userLikedThisLike = filteredLikesByEmoji.some((like) => {
    return like.userId === user?.id;
  });

  return (
    <div className="flex flex-none">
      <fetcher.Form method="post" className="inline flex-none">
        <input type="hidden" name="messageId" value={message!.id} />
        <input type="hidden" name="emoji" value={emoji} />
        <button
          type="submit"
          className={clsx(
            "btn",
            "btn-sm",
            userLikedThisLike ? "btn-secondary-focus" : "btn-secondary"
          )}
          name="_action"
          value={userLikedThisLike ? "unlike" : "like"}
        >
          {emoji}
        </button>
      </fetcher.Form>
      {filteredLikesByEmoji.length > 0 && (
        <div className="avatar-group flex-none -space-x-3 px-1">
          {filteredLikesByEmoji.map((like) => {
            if (!like) return null;
            if (like.emoji !== emoji) return null;
            const { user } = like;
            if (user.avatar) {
              return (
                <div className="not-prose avatar" key={like.id}>
                  <div className="w-6">
                    <img src={user.avatar} alt={user.username} />
                  </div>
                </div>
              );
            }
            return (
              <div className="avatar placeholder border-0" key={like.id}>
                <div className="w-6 rounded-full bg-primary">
                  <span className="tooltip" data-tip={user.username}>
                    {user.username.slice(0, 1).toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
