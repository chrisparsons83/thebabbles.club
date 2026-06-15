import { useEffect, useMemo, useRef, useState } from "react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import invariant from "tiny-invariant";
import Favicon from "react-favicon";

import { requireActiveUser } from "~/session.server";
import type { PostWithMessages } from "~/models/post.server";
import type { Message, MessageWithUser } from "~/models/message.server";
import { updateMessage , createMessage } from "~/models/message.server";
import { getPost } from "~/models/post.server";
import MessageComponent from "~/components/Message";
import MessageForm from "~/components/MessageForm";
import GoToNextUnreadButton from "~/components/GoToNextUnreadButton";
import { useSocket } from "~/context";
import type { Like, LikeWithUser } from "~/models/like.server";
import { deleteLike, findLikeByUserAndMessage , createLike } from "~/models/like.server";

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
  const [pageLoadTime, setPageLoadTime] = useState(new Date());
  const [unreadMessages, setUnreadMessages] = useState<MessageWithUser[]>([]);

  // Always in sync with the latest render so socket handlers can read it
  // without needing listOfMessages in the effect dependency array.
  const listOfMessagesRef = useRef(listOfMessages);
  listOfMessagesRef.current = listOfMessages;

  const handleClearMessages = () => {
    setPageLoadTime(() => new Date());
    setUnreadMessages([]);
  };

  const handleReadMessage = (message: MessageWithUser) => {
    // It's possible the message is already marked as read by scrolling past it
    // or by clicking the button, so we check if it's still in unreadMessages.
    setUnreadMessages((messages) =>
      messages.filter((m) => m && message && m.id !== message.id)
    );
  };

  const handleScrollToNextUnread = () => {
    if (unreadMessages.length === 0) return;

    let scrolledMessage: MessageWithUser | null = null;
    const orphanedIds = new Set<string>();

    for (const message of unreadMessages) {
      if (!message?.id) continue;
      const element = document.getElementById(`message-${message.id}`);
      if (element && !scrolledMessage) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        scrolledMessage = message;
      } else if (!element) {
        orphanedIds.add(message.id);
      }
    }

    // Only remove entries once we've confirmed the DOM is painted (at least one
    // element was found). If nothing was found the page may still be rendering —
    // avoid discarding valid unread notifications.
    if (scrolledMessage) {
      const scrolledId = scrolledMessage.id;
      setUnreadMessages((prev) =>
        prev.filter((m) => m?.id !== scrolledId && !(m?.id && orphanedIds.has(m.id)))
      );
    }
  };

  useEffect(() => {
    if (!socket) return;

    if (data.post) {
      socket.emit("joinPage", data.post.id);
    }

    const handleReconnect = () => {
      if (data.post) socket.emit("joinPage", data.post.id);
    };
    socket.io.on("reconnect", handleReconnect);

    socket.on("messagePosted", (newMessage: MessageWithUser) => {
      if (!newMessage) return;
      // Use ref so this handler never needs listOfMessages in the effect deps,
      // avoiding full listener teardown on every received message.
      if (listOfMessagesRef.current.some((message) => message?.id === newMessage.id))
        return;

      setUnreadMessages((messages) => {
        if (!messages.find(m => m?.id === newMessage.id)) {
          return [...messages, newMessage].sort((a, b) => {
            if (a?.createdAt && b?.createdAt) {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            }
            return 0;
          });
        }
        return messages;
      });
      setListOfMessages((messages) => [newMessage, ...messages]);
    });

    socket.on("messageEdited", (editedMessage: MessageWithUser) => {
      if (!editedMessage) return;
      setListOfMessages((messages) => {
        const idx = messages.findIndex(m => m?.id === editedMessage.id);
        if (idx === -1) return messages;
        const existing = messages[idx];
        if (!existing) return messages;
        const updated = [...messages];
        updated[idx] = { ...existing, text: editedMessage.text };
        return updated;
      });
    });

    socket.on("likePosted", (newLike: LikeWithUser) => {
      if (!newLike) return;
      setListOfMessages((messages) => {
        const idx = messages.findIndex(m => m?.id === newLike.messageId);
        if (idx === -1) return messages;
        const existing = messages[idx];
        if (!existing) return messages;
        const updated = [...messages];
        updated[idx] = { ...existing, likes: [...existing.likes, newLike] };
        return updated;
      });
    });

    socket.on("unlikePosted", (newUnlike: LikeWithUser) => {
      if (!newUnlike) return;
      setListOfMessages((messages) => {
        const idx = messages.findIndex(m => m?.id === newUnlike.messageId);
        if (idx === -1) return messages;
        const existing = messages[idx];
        if (!existing) return messages;
        const updated = [...messages];
        updated[idx] = { ...existing, likes: existing.likes.filter(l => l.id !== newUnlike.id) };
        return updated;
      });
    });

    // Use functional updater so syncTimer doesn't need to be in the effect deps.
    socket.on("outOfSync", () => {
      setSyncTimer((current) => {
        if (current === INITIAL_SYNC_TIMER) return SECOND_SYNC_TIMER;
        if (current === SECOND_SYNC_TIMER) return THIRD_SYNC_TIMER;
        return null;
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.io.off("reconnect", handleReconnect);
      socket.emit("leavePage", data.post?.id);
    };
  }, [socket, data, setListOfMessages]);

  useEffect(() => {
    if (!data.post) return;
    const serverMessages = data.post.messages;
    const serverIds = new Set(serverMessages.map((m) => m?.id));
    // Reset to server truth; also drop any unread entries the server no longer has
    // (e.g. messages that were rejected or deleted before the next loader refresh).
    setListOfMessages(serverMessages);
    setUnreadMessages((prev) => prev.filter((m) => m?.id && serverIds.has(m.id)));
  }, [data, setListOfMessages]);

  const messageDisplay =
    listOfMessages.length > 0 ? listOfMessages : data.post?.messages ?? [];

  const childrenMap = useMemo(() => {
    const map = new Map<string, MessageWithUser[]>();
    messageDisplay.forEach((message) => {
      if (message?.parentId) {
        if (!map.has(message.parentId)) map.set(message.parentId, []);
        map.get(message.parentId)!.push(message);
      }
    });
    map.forEach((children) => children.reverse());
    return map;
  }, [messageDisplay]);

  if (!data.post) {
    return null;
  }

  return (
    <div>
      <Favicon url="/favicon.ico" alertCount={unreadMessages.length} />
      <h1 className="mb-4 text-2xl font-bold">{data.post.title}</h1>
      <aside className="text-sm">
        Created on {new Date(data.post.createdAt).toLocaleDateString()}
        {" ∙ "}
        {messageDisplay.length} messages
        <button
          className="btn btn-secondary btn-xs ml-2"
          onClick={handleClearMessages}
        >
          Mark all as read
        </button>
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
                  childrenMap={childrenMap}
                  structureVersion={messageDisplay.length}
                  key={message.id}
                  pageLoadTime={pageLoadTime}
                  cloudName={data.cloudinaryCloudName}
                  handleReadMessage={handleReadMessage}
                />
              )
            );
          })}
      </div>
      <GoToNextUnreadButton
        unreadMessagesCount={unreadMessages.length}
        onScrollToNext={handleScrollToNextUnread}
      />
    </div>
  );
}
