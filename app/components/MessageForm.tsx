import { Message, Post } from "@prisma/client";
import { useFetcher } from "@remix-run/react";
import { useEffect, useRef } from "react";

type Props = {
  id: Post["id"];
  parentId?: Message["parentId"];
  toggleForm?: () => void;
};

export default function MessageForm({ id, parentId, toggleForm }: Props) {
  const fetcher = useFetcher();
  const isAdding = fetcher.state === "submitting";
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isAdding) {
      formRef.current?.reset();
    }
  }, [isAdding]);

  return (
    <fetcher.Form method="post" className="mb-8" ref={formRef}>
      <div>
        <label htmlFor="text" className="form-control">
          Message:
          <textarea
            name="text"
            placeholder="Add a comment"
            className="textarea textarea-bordered mt-1"
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
