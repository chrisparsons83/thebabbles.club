import { Message, Post } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

type Props = {
  id: Post["id"];
  parentId?: Message["parentId"];
  toggleForm?: () => void;
};

export default function MessageForm({ id, parentId, toggleForm }: Props) {
  const fetcher = useFetcher();
  const isAdding = fetcher.state === "submitting";
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lastState, setLastState] = useState("");

  useEffect(() => {
    if (fetcher.state === "idle") {
      formRef.current?.reset();
      if (lastState === "loading" && toggleForm) toggleForm();
    }
    setLastState(fetcher.state);
  }, [fetcher.state, lastState, toggleForm]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <fetcher.Form method="post" className="mb-8" ref={formRef}>
      <div>
        <label htmlFor="text" className="form-control">
          Message:
          <textarea
            name="text"
            placeholder="Add a comment"
            className="textarea textarea-bordered mt-1"
            ref={textareaRef}
          />
        </label>
      </div>
      <input type="hidden" value={id} name="postId" />
      <input type="hidden" value={parentId ?? undefined} name="parentId" />
      <button
        className="btn btn-primary mt-4 rounded"
        type="submit"
        disabled={isAdding}
      >
        {isAdding ? "Posting..." : "Post"}
      </button>
    </fetcher.Form>
  );
}
