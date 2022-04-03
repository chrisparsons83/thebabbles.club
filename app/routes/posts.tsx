import { json, LoaderFunction } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { requireActiveUser } from "~/session.server";

export const loader: LoaderFunction = async ({ request }) => {
  await requireActiveUser(request);
  return json({});
};

export default function NewPostPage() {
  return (
    <div className="px-4 md:container md:mx-auto">
      <Outlet />
    </div>
  );
}
