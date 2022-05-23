import { useEffect, useRef, useState } from "react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import invariant from "tiny-invariant";

import { requireActiveUser } from "~/session.server";
import type { PostWithMessages } from "~/models/post.server";
import type { Message, MessageWithUser } from "~/models/message.server";
import { updateMessage } from "~/models/message.server";
import { createMessage } from "~/models/message.server";
import { getPost } from "~/models/post.server";
import MessageComponent from "~/components/Message";
import MessageForm from "~/components/MessageForm";
import { useSocket } from "~/context";
import type { Like, LikeWithUser } from "~/models/like.server";
import { deleteLike, findLikeByUserAndMessage } from "~/models/like.server";
import { createLike } from "~/models/like.server";
import { useInterval } from "~/lib/useInterval";

const INITIAL_SYNC_TIMER = 60000;
const SECOND_SYNC_TIMER = 10000;
const THIRD_SYNC_TIMER = 5000;

type LoaderData = {
  post: PostWithMessages;
  cloudinaryCloudName?: string;
};

type ActionData = {
  formError?: string;
  fields?: {
    text?: string;
    postId?: string;
    parentId?: string | null;
    messageId?: string;
    emoji?: string;
  };
  errors?: {
    text?: string;
    postId?: string;
    parentId?: string;
    messageId?: string;
    emoji?: string;
  };
  message?: Message;
  like?: Like;
  unlike?: Like;
  editedMessage?: Message;
};

function validateText(text: string) {
  if (typeof text !== "string" || text.length === 0) {
    return "Message is required";
  }
}

function validateMessageId(messageId: string) {
  // TODO: Check that this is actually a post ID?
  if (typeof messageId !== "string" || messageId.length === 0) {
    return "Post is required";
  }
}

function validatePostId(postId: string) {
  // TODO: Check that this is actually a post ID?
  if (typeof postId !== "string" || postId.length === 0) {
    return "Post is required";
  }
}

export const action: ActionFunction = async ({ request }) => {
  const { id: userId } = await requireActiveUser(request);

  const formData = await request.formData();
  const action = formData.get("_action");

  switch (action) {
    case "createMessage": {
      const text = formData.get("text");
      const postId = formData.get("postId");
      let parentId = formData.get("parentId");

      if (
        typeof text !== "string" ||
        typeof postId !== "string" ||
        typeof parentId !== "string"
      ) {
        return json<ActionData>(
          { formError: "Form was not submitted correctly." },
          { status: 400 }
        );
      }

      const errors = {
        text: validateText(text),
        postId: validatePostId(postId),
      };

      if (parentId === "") parentId = null;
      const fields = { text, postId, parentId };

      if (Object.values(errors).some(Boolean)) {
        return json<ActionData>({ errors, fields }, { status: 400 });
      }

      const message = await createMessage({
        userId,
        text,
        postId,
        parentId,
      });

      return json<ActionData>({ message });
    }
    case "updateMessage": {
      const text = formData.get("text");
      const messageId = formData.get("existingMessageId");

      if (typeof text !== "string" || typeof messageId !== "string") {
        return json<ActionData>(
          { formError: "Form was not submitted correctly." },
          { status: 400 }
        );
      }

      const errors = {
        text: validateText(text),
      };

      const fields = { text, messageId };

      if (Object.values(errors).some(Boolean)) {
        return json<ActionData>({ errors, fields }, { status: 400 });
      }

      const message = await updateMessage(messageId, text);

      return json<ActionData>({ editedMessage: message });
    }
    case "like": {
      const emoji = formData.get("emoji");
      const messageId = formData.get("messageId");

      if (typeof emoji !== "string" || typeof messageId !== "string") {
        return json<ActionData>(
          { formError: "Form was not submitted correctly." },
          { status: 400 }
        );
      }
      const errors = {
        emoji: validateText(emoji),
        messageId: validateMessageId(messageId),
      };

      const fields = { emoji, messageId, userId };

      if (Object.values(errors).some(Boolean)) {
        return json<ActionData>({ errors, fields }, { status: 400 });
      }

      const like = await createLike(fields);

      return json<ActionData>({ like });
    }
    case "unlike": {
      const emoji = formData.get("emoji");
      const messageId = formData.get("messageId");

      if (typeof emoji !== "string" || typeof messageId !== "string") {
        return json<ActionData>(
          { formError: "Form was not submitted correctly." },
          { status: 400 }
        );
      }

      const like = await findLikeByUserAndMessage({ userId, emoji, messageId });

      if (!like) {
        return json<ActionData>(
          { formError: "Like does not exist." },
          { status: 400 }
        );
      }

      await deleteLike({ id: like.id });

      return json<ActionData>({ unlike: like });
    }
  }
};

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireActiveUser(request);
  invariant(params.postId, "postId not found");

  const post = await getPost({ id: params.postId });
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }
  return json<LoaderData>({
    post,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
};

export default function PostPage() {
  let data = useLoaderData() as LoaderData;
  const socket = useSocket();
  const [listOfMessages, setListOfMessages] =
    useState<MessageWithUser[]>(data.post!.messages) ||
    ([] as MessageWithUser[]);
  const [syncTimer, setSyncTimer] = useState<number | null>(INITIAL_SYNC_TIMER);
  const pageLoadTime = useRef(new Date());

  useEffect(() => {
    if (!socket) return;

    if (data.post) {
      socket.emit("joinPage", data.post.id);
    }

    socket.io.on("reconnect", () => {
      if (data.post) socket.emit("joinPage", data.post.id);
    });

    socket.on("messagePosted", (newMessage: MessageWithUser) => {
      if (!newMessage) return;
      if (listOfMessages.some((message) => message?.id === newMessage.id))
        return;

      setListOfMessages((messages) => [newMessage, ...messages]);
    });

    socket.on("messageEdited", (editedMessage: MessageWithUser) => {
      if (!editedMessage) return;

      const message = listOfMessages.find((message) => {
        return message && message.id === editedMessage.id;
      });

      if (!message) return;

      message.text = editedMessage.text;
      setListOfMessages((messages) => [...messages]);
    });

    socket.on("likePosted", (newLike: LikeWithUser) => {
      if (!newLike) return;

      const message = listOfMessages.find((message) => {
        return message && message.id === newLike.messageId;
      });

      if (!message) return;
      message.likes.push(newLike);
      setListOfMessages((messages) => [...messages]);
    });

    socket.on("unlikePosted", (newUnlike: LikeWithUser) => {
      if (!newUnlike) return;

      const message = listOfMessages.find((message) => {
        return message && message.id === newUnlike.messageId;
      });

      if (!message) return;

      message.likes = message.likes.filter((like) => {
        return like.id !== newUnlike.id;
      });

      setListOfMessages((messages) => [...messages]);
    });

    socket.on("outOfSync", () => {
      if (syncTimer === INITIAL_SYNC_TIMER) {
        setSyncTimer(SECOND_SYNC_TIMER);
      } else if (syncTimer === SECOND_SYNC_TIMER) {
        setSyncTimer(THIRD_SYNC_TIMER);
      } else {
        setSyncTimer(null);
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.emit("leavePage", data.post?.id);
    };
  }, [socket, data, setListOfMessages, listOfMessages, syncTimer]);

  useEffect(() => {
    if (!data.post) return;

    setListOfMessages(() => data.post?.messages!);
  }, [data, setListOfMessages]);

  useInterval(() => {
    if (!data.post || !socket) return;

    const numberOfMessagesInList = listOfMessages.length;
    socket.emit("ping", { postId: data.post.id, numberOfMessagesInList });
  }, syncTimer);

  if (!data.post) {
    return null;
  }

  const messageDisplay =
    listOfMessages.length > 0 ? listOfMessages : data.post.messages;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{data.post.title}</h1>
      <aside className="text-sm">
        Created on {new Date(data.post.createdAt).toLocaleDateString()}
        {" ∙ "}
        {messageDisplay.length} messages
      </aside>
      <img src={data.post.gif} alt={data.post.title} className="mb-4" />
      <MessageForm id={data.post.id} />
      {!syncTimer && (
        <div className="alert alert-error mt-4 justify-start">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 flex-shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>You have lost your connection. Please refresh the page.</span>
        </div>
      )}
      <div className="pt-8">
        {messageDisplay
          .filter((message) => message && !message.parentId)
          .map((message) => {
            return (
              message && (
                <MessageComponent
                  message={message}
                  depth={0}
                  allMessages={messageDisplay}
                  key={message.id}
                  pageLoadTime={pageLoadTime.current}
                  cloudName={data.cloudinaryCloudName}
                />
              )
            );
          })}
      </div>
    </div>
  );
}
