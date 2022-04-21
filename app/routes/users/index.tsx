import { json, LoaderFunction } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { getActiveUsers, getInactiveUsers, User } from "~/models/user.server";
import { requireActiveUser } from "~/session.server";

type LoaderData = {
  activeUsers: User[];
  inactiveUsers: User[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireActiveUser(request);
  const activeUsers = await getActiveUsers();
  const inactiveUsers = await getInactiveUsers();
  return json<LoaderData>({ activeUsers, inactiveUsers });
};

export default function UserIndex() {
  const { activeUsers, inactiveUsers } = useLoaderData<LoaderData>();

  return (
    <>
      <div className="mb-4">
        <h1>User Index</h1>
        {activeUsers.map((user: User) => (
          <p key={user.id}>
            <Link to={`${user.id}`}>{user.username}</Link>
          </p>
        ))}
      </div>
      <div>
        <h1>Pending Users</h1>
        {inactiveUsers.map((user: User) => (
          <p key={user.id}>
            <Link to={`${user.id}`}>{user.username}</Link>
          </p>
        ))}
      </div>
    </>
  );
}
