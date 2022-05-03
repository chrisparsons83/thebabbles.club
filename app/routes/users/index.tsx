import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData, useLoaderData } from "@remix-run/react";
import type { User } from "~/models/user.server";
import {
  activateUser,
  deactivateUser,
  getActiveUsers,
  getInactiveUsers,
  getUserById,
} from "~/models/user.server";
import { requireActiveUser } from "~/session.server";

type ActionData = {
  formError?: string;
  fields?: {
    _action?: string;
    userId?: string;
  };
  errors?: {
    _action?: string;
    userId?: string;
  };
  response?: string;
};

type LoaderData = {
  currentUser: User;
  activeUsers: User[];
  inactiveUsers: User[];
};

async function validateUserId(userId: string) {
  const user = await getUserById(userId);
  if (!user) {
    return "User not found";
  }
}

export const action: ActionFunction = async ({ request }) => {
  await requireActiveUser(request);
  const formData = await request.formData();
  const action = formData.get("_action");
  const userId = formData.get("userId");

  if (typeof action !== "string" || typeof userId !== "string") {
    return json<ActionData>(
      { formError: "Form was not submitted correctly." },
      { status: 400 }
    );
  }

  const errors = {
    userId: await validateUserId(userId),
  };
  const fields = { action, userId };
  if (Object.values(errors).some(Boolean)) {
    return json<ActionData>({ errors, fields }, { status: 400 });
  }

  switch (action) {
    case "deactivate": {
      await deactivateUser(userId);
      break;
    }
    case "activate": {
      await activateUser(userId);
      break;
    }
  }

  const user = await getUserById(userId);

  const response = `${user?.username} was updated.`;

  return json<ActionData>({ response });
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentUser = await requireActiveUser(request);
  const activeUsers = await getActiveUsers();
  const inactiveUsers = await getInactiveUsers();
  return json<LoaderData>({ currentUser, activeUsers, inactiveUsers });
};

export default function UserIndex() {
  const actionData = useActionData() as ActionData;
  const { currentUser, activeUsers, inactiveUsers } =
    useLoaderData<LoaderData>();

  const response = actionData?.response;

  return (
    <>
      {response && <div className="alert alert-success mb-4">{response}</div>}
      <div className="mb-4">
        <h1>User Index</h1>
        <div className="alert alert-warning">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current flex-shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <span>Warning: Deactivating someone will remove their ability to acccess the website!</span>
          </div>
        </div>
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>User</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {activeUsers.map((user: User) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td className="text-right">
                  {currentUser.id === user.id && (
                    <Link className="btn btn-primary" to={`${user.id}/edit`}>
                      Edit
                    </Link>
                  )}
                  <Form className="ml-4 inline" method="post">
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      className="btn btn-primary"
                      type="submit"
                      name="_action"
                      value="deactivate"
                    >
                      Deactivate
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h1>Pending Users</h1>
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>User</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {inactiveUsers.map((user: User) => (
              <tr key={user.id}>
                <td>
                  <Link to={`${user.id}`}>{user.username}</Link>
                </td>
                <td className="text-right">
                  <Form method="post">
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      className="btn btn-primary"
                      type="submit"
                      name="_action"
                      value="activate"
                    >
                      Activate
                    </button>
                  </Form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
