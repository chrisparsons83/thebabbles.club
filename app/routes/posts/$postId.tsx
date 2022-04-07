import { json, LoaderFunction } from "@remix-run/node";
import invariant from "tiny-invariant";
import { requireActiveUser } from "~/session.server";
import type { PostWithMessages } from "~/models/post.server";
import { getPost } from "~/models/post.server";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect } from "react";

type LoaderData = {
  post: PostWithMessages;
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
  const data = useLoaderData() as LoaderData;
  const message = useFetcher();

  useEffect((): void => {
    if (message.type === "done" && message.data.message) {
      console.log("done!");
    }
  }, [message]);

  if (!data.post) {
    return null;
  }

  return (
    <div>
      <h1>{data.post.title}</h1>
      <img src={data.post.gif} alt={data.post.title} />
      <message.Form action="/messages/new" method="post">
        <textarea name="text" placeholder="Add a comment" />
        <input type="hidden" value={data.post.id} name="postId" />
        <button type="submit">Post</button>
      </message.Form>
      {data.post.messages.map((message) => (
        <p key={message.id}>{message.text}</p>
      ))}
    </div>
  );
}
