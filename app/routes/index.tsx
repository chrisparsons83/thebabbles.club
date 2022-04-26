import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireActiveUser } from "~/session.server";

import type { Post } from "~/models/post.server";
import { getPosts } from "~/models/post.server";
import { Link, useLoaderData } from "@remix-run/react";

type LoaderData = {
  posts: Post[];
};

export const loader: LoaderFunction = async ({ request }) => {
  await requireActiveUser(request);
  const posts = await getPosts();
  return json<LoaderData>({ posts });
};

export default function Index() {
  const data = useLoaderData<LoaderData>();

  return (
    <main>
      {data?.posts.map((post: Post) => (
        <p key={post.id}>
          <Link to={`posts/${post.id}`}>{post.title}</Link>
        </p>
      ))}
    </main>
  );
}
