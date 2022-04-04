import { json, LoaderFunction } from "@remix-run/node";
import invariant from "tiny-invariant";
import { requireActiveUser } from "~/session.server";
import type { Post } from "~/models/post.server";
import { getPost } from "~/models/post.server";
import { useLoaderData } from "@remix-run/react";

type LoaderData = {
  post: Post;
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

  return (
    <div>
      <h1>{data.post.title}</h1>
      <img src={data.post.gif} alt={data.post.title} />
    </div>
  );
}
