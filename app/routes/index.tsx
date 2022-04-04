import { json, LoaderFunction } from "@remix-run/node";
import { requireActiveUser } from "~/session.server";

import { getPosts } from "~/models/post.server";

type LoaderData = {
  posts: Awaited<ReturnType<typeof getPosts>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  await requireActiveUser(request);
  const posts = await getPosts();
  return json<LoaderData>({ posts });
};

export default function Index() {
  return <main>Hello!</main>;
}
