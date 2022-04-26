import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { requireActiveUser } from "~/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireActiveUser(request);
  return json({});
};

export default function NewPostPage() {
  return (
    <div>
      Index Page! <Link to="new">New Post</Link>
    </div>
  );
}
