import { json, LoaderFunction } from "@remix-run/node";
import { requireActiveUser } from "~/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireActiveUser(request);
  return json({});
};

export default function NewPostPage() {
  return <div>Create a new post placeholder!</div>;
}
