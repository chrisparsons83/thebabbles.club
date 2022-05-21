import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { requireActiveUser } from "~/session.server";

import type { Post } from "~/models/post.server";
import { getPosts } from "~/models/post.server";
import { Link, useLoaderData } from "@remix-run/react";
import ReactTimeAgo from "react-time-ago";

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
    <main className="md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-3">
      {data?.posts.map((post: Post) => (
        <div
          className="not-prose card mb-4 w-full bg-primary shadow-xl md:mb-0"
          key={post.id}
        >
          <div className="card-body">
            <h2 className="card-title">{post.title}</h2>
            <p className="card-text">
              Posted{" "}
              <ReactTimeAgo
                date={new Date(post.createdAt)}
                locale="en-US"
                timeStyle="round-minute"
              />
            </p>
            <div className="card-actions justify-end">
              <Link
                to={`posts/${post.id}`}
                className="btn btn-secondary no-underline"
              >
                Open Post
              </Link>
            </div>
          </div>
        </div>
      ))}
    </main>
  );
}
