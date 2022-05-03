import { useEffect, useState } from "react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import Autolinker from "autolinker";
import DOMPurify from "isomorphic-dompurify";
import snarkdown from "snarkdown";
import invariant from "tiny-invariant";

import { requireActiveUser } from "~/session.server";
import type { PostWithMessages } from "~/models/post.server";
import type { Message, MessageWithUser } from "~/models/message.server";
import { createMessage } from "~/models/message.server";
import { getPost } from "~/models/post.server";
import MessageComponent from "~/components/Message";
import MessageForm from "~/components/MessageForm";
import { useSocket } from "~/context";
import type { Like, LikeWithUser } from "~/models/like.server";
import { deleteLike, findLikeByUserAndMessage } from "~/models/like.server";
import { createLike } from "~/models/like.server";

type LoaderData = {
  post: PostWithMessages;
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

      const processedText = snarkdown(
        Autolinker.link(DOMPurify.sanitize(text))
      );

      const message = await createMessage({
        userId,
        text: processedText,
        postId,
        parentId,
      });

      return json<ActionData>({ message });
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
  return json<LoaderData>({ post });
};

export default function PostPage() {
  let data = useLoaderData() as LoaderData;
  const socket = useSocket();
  const [listOfMessages, setListOfMessages] =
    useState<MessageWithUser[]>(data.post!.messages) ||
    ([] as MessageWithUser[]);

  useEffect(() => {
    if (!socket) return;

    if (data.post) {
      socket.emit("joinPage", data.post.id);
    }

    socket.on("messagePosted", (newMessage: MessageWithUser) => {
      if (!newMessage) return;
      if (listOfMessages.some((message) => message?.id === newMessage.id))
        return;

      setListOfMessages((messages) => [newMessage, ...messages]);
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

    return () => {
      socket.removeAllListeners();
      socket.emit("leavePage", data.post?.id);
    };
  }, [socket, data, setListOfMessages, listOfMessages]);

  useEffect(() => {
    if (!data.post) return;

    setListOfMessages(() => data.post?.messages!);
  }, [data, setListOfMessages]);

  if (!data.post) {
    return null;
  }

  const messageDisplay =
    listOfMessages.length > 0 ? listOfMessages : data.post.messages;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{data.post.title}</h1>
      <img src={data.post.gif} alt={data.post.title} className="mb-4" />
      <MessageForm id={data.post.id} />
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
                />
              )
            );
          })}
      </div>
    </div>
  );
}
