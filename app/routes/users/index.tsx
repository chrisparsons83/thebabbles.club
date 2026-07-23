import type { ActionFunction, LoaderArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, Link, useActionData } from "@remix-run/react";
import type { User } from "~/models/user.server";
import {
  activateUser,
  deactivateUser,
  deleteInactiveUsers,
  deleteUser,
  getActiveUsers,
  getInactiveUsers,
  getUserById,
} from "~/models/user.server";
import { requireActiveUser } from "~/session.server";
import { typedjson, useTypedLoaderData } from "remix-typedjson";

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

export const action: ActionFunction = async ({ request }) => {
  await requireActiveUser(request);
  const formData = await request.formData();
  const action = formData.get("_action");

  if (typeof action !== "string") {
    return json<ActionData>(
      { formError: "Form was not submitted correctly." },
      { status: 400 }
    );
  }

  if (action === "deleteAllPending") {
    const { count } = await deleteInactiveUsers();
    const response = `${count} pending ${
      count === 1 ? "user was" : "users were"
    } deleted.`;
    return json<ActionData>({ response });
  }

  const userId = formData.get("userId");

  if (typeof userId !== "string") {
    return json<ActionData>(
      { formError: "Form was not submitted correctly." },
      { status: 400 }
    );
  }

  const user = await getUserById(userId);

  if (!user) {
    return json<ActionData>(
      { errors: { userId: "User not found" }, fields: { _action: action, userId } },
      { status: 400 }
    );
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
    case "delete": {
      if (user.isActive) {
        return json<ActionData>(
          { formError: "Only pending users can be deleted." },
          { status: 400 }
        );
      }
      try {
        await deleteUser(userId);
      } catch {
        // User was already removed (e.g. a concurrent delete); nothing to do.
      }
      return json<ActionData>({
        response: `${user.username} was deleted.`,
      });
    }
  }

  const response = `${user.username} was updated.`;

  return json<ActionData>({ response });
};

export const loader = async ({ request }: LoaderArgs) => {
  const currentUser = await requireActiveUser(request);
  const activeUsers = await getActiveUsers();
  const inactiveUsers = await getInactiveUsers();
  return typedjson<LoaderData>({ currentUser, activeUsers, inactiveUsers });
};

export default function UserIndex() {
  const actionData = useActionData() as ActionData;
  const { currentUser, activeUsers, inactiveUsers } = useTypedLoaderData();

  const response = actionData?.response;

  return (
    <>
      {response && <div className="alert alert-success mb-4">{response}</div>}
      <div className="mb-4">
        <h1>User Index</h1>
        <div className="alert alert-warning">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 flex-shrink-0 stroke-current"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>
              Warning: Deactivating someone will remove their ability to acccess
              the website!
            </span>
          </div>
        </div>
        <table className="table-zebra table w-full">
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
        <div className="flex items-center justify-between">
          <h1>Pending Users</h1>
          {inactiveUsers.length > 0 && (
            <Form
              method="post"
              onSubmit={(event) => {
                if (
                  !window.confirm(
                    "Delete all pending users? This cannot be undone."
                  )
                ) {
                  event.preventDefault();
                }
              }}
            >
              <button
                className="btn btn-error"
                type="submit"
                name="_action"
                value="deleteAllPending"
              >
                Clear All Pending
              </button>
            </Form>
          )}
        </div>
        <table className="table-zebra table w-full">
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
                  <Form className="inline" method="post">
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
                  <Form
                    className="ml-4 inline"
                    method="post"
                    onSubmit={(event) => {
                      if (
                        !window.confirm(
                          `Delete ${user.username}? This cannot be undone.`
                        )
                      ) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      className="btn btn-error"
                      type="submit"
                      name="_action"
                      value="delete"
                    >
                      Delete
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
