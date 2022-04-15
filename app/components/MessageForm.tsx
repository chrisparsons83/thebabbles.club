import { Post } from "@prisma/client";
import { useFetcher } from "@remix-run/react";

type Props = Pick<Post, "id">;

export default function MessageForm({ id }: Props) {
  const fetcher = useFetcher();

  return (
    <fetcher.Form method="post" className="mb-8">
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
      <button className="btn btn-primary mt-4 rounded" type="submit">
        Post
      </button>
    </fetcher.Form>
  );
}
