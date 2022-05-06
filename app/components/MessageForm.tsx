import type { Message, Post } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "~/context";
import type { MessageWithUser } from "~/models/message.server";

type Props = {
  id: Post["id"];
  parentId?: Message["parentId"];
  toggleForm?: () => void;
  existingMessage?: MessageWithUser;
};

export default function MessageForm({
  id,
  parentId,
  toggleForm,
  existingMessage,
}: Props) {
  const fetcher = useFetcher();
  const isAdding = fetcher.state === "submitting";
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lastState, setLastState] = useState("");
  const socket = useSocket();

  useEffect(() => {
    if (fetcher.state === "idle") {
      if (lastState === "loading" && toggleForm) toggleForm();
    }

    if (fetcher.state === "loading" && lastState !== "submitting" && socket) {
      console.log(fetcher.data);
      if (fetcher.data.message)
        socket.emit("messagePosted", fetcher.data.message);
      if (fetcher.data.editedMessage)
        socket.emit("messageEdited", fetcher.data.editedMessage);
      formRef.current?.reset();
    }

    setLastState(fetcher.state);
  }, [fetcher.data, fetcher.state, lastState, toggleForm, socket]);

  useEffect(() => {
    const end = textareaRef?.current?.value.length || 0;
    textareaRef.current?.setSelectionRange(end, end);
    textareaRef.current?.focus();
  }, []);

  return (
    <fetcher.Form method="post" ref={formRef} className="mt-2">
      <div>
        <label htmlFor="text" className="form-control">
          Message:
          <textarea
            name="text"
            placeholder="Add a comment"
            className="textarea textarea-bordered mt-1"
            ref={textareaRef}
            defaultValue={existingMessage?.text}
          />
        </label>
      </div>
      <input type="hidden" value={id} name="postId" />
      <input type="hidden" value={parentId ?? undefined} name="parentId" />
      <input
        type="hidden"
        value={existingMessage?.id ?? undefined}
        name="existingMessageId"
      />
      <button
        className="btn btn-primary mt-4 rounded"
        type="submit"
        disabled={isAdding}
        name="_action"
        value={existingMessage ? "updateMessage" : "createMessage"}
      >
        {isAdding ? "Posting..." : "Post"}
      </button>
    </fetcher.Form>
  );
}
