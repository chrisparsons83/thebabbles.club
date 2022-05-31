import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import { getSearchParams } from "remix-params-helper";
import z from "zod";
import { findUserByPasswordResetInfo, updateUser } from "~/models/user.server";

import { createUserSession, getUserId } from "~/session.server";
import type { User } from "~/models/user.server";
import { Form, useActionData, useLoaderData } from "@remix-run/react";

const ParamsSchema = z.object({
  user: z.string(),
  key: z.string(),
});

interface ActionData {
  errors: {
    password?: string;
    passwordConfirm?: string;
  };
}

interface LoaderData {
  user: User;
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const password = formData.get("password");
  const passwordConfirm = formData.get("passwordConfirm");
  const userId = formData.get("userId");
  const key = formData.get("key");

  if (typeof userId !== "string" || typeof key !== "string") {
    throw new Response("Reset form is malformed", { status: 400 });
  }

  if (typeof password !== "string") {
    return json<ActionData>({
      errors: { password: "New Password is required" },
    });
  }

  if (typeof passwordConfirm !== "string") {
    return json<ActionData>({
      errors: { password: "Confirm New Password is required" },
    });
  }

  if (password !== passwordConfirm) {
    return json<ActionData>({
      errors: { passwordConfirm: "Passwords do not match" },
    });
  }

  const existingUser = await findUserByPasswordResetInfo(userId, key);
  if (!existingUser) {
    throw new Response("Reset form is malformed", { status: 400 });
  }

  const updatedUser = await updateUser(userId, {
    password,
    passwordResetHash: null,
    passwordResetExpires: null,
  });

  if (!updatedUser) {
    throw new Response("Failed to update user", { status: 500 });
  }

  return createUserSession({
    request,
    userId: updatedUser.id,
    remember: false,
    redirectTo: "/",
  });
};

export const loader: LoaderFunction = async ({ request }) => {
  const userLoggedIn = await getUserId(request);
  if (userLoggedIn) return redirect("/");

  const result = getSearchParams(request, ParamsSchema);
  if (!result.success) {
    console.error(result.errors);
    throw new Response("Reset link is malformed", { status: 400 });
  }
  const { user: userId, key } = result.data;

  const user = await findUserByPasswordResetInfo(userId, key);
  if (!user) {
    throw new Response("Reset link is malformed", { status: 400 });
  }

  return json<LoaderData>({ user });
};

export default function ResetPassword() {
  const { user } = useLoaderData<LoaderData>();
  const actionData = useActionData();
  console.log(user);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md p-8">
        <h1 className="mb-4 text-2xl font-bold">Reset Your Password</h1>
        <p>Thanks {user.username}, please set your new password below.</p>
        <Form method="post" className="space-y-6" noValidate>
          <div>
            <label htmlFor="password">New Password</label>
            <div className="mt-1">
              <input
                id="password"
                required
                autoFocus={true}
                name="password"
                type="password"
                aria-invalid={actionData?.errors?.password ? true : undefined}
                aria-describedby="password-error"
                className="w-full rounded border border-gray-500 bg-base-100 px-2 py-1 text-lg"
              />
              {actionData?.errors?.password && (
                <div className="pt-1 text-red-700" id="password-error">
                  {actionData.errors.password}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="passwordConfirm">Confirm New Password</label>
            <div className="mt-1">
              <input
                id="passwordConfirm"
                required
                autoFocus={true}
                name="passwordConfirm"
                type="password"
                aria-invalid={
                  actionData?.errors?.passwordConfirm ? true : undefined
                }
                aria-describedby="passwordConfirm-error"
                className="w-full rounded border border-gray-500 bg-base-100 px-2 py-1 text-lg"
              />
              {actionData?.errors?.passwordConfirm && (
                <div className="pt-1 text-red-700" id="passwordConfirm-error">
                  {actionData.errors.passwordConfirm}
                </div>
              )}
            </div>
          </div>

          <input type="hidden" name="userId" value={user.id} />
          <input type="hidden" name="key" value={user.passwordResetHash!} />
          <button
            type="submit"
            className="btn btn-primary w-full rounded py-2 px-4"
          >
            Update password and login
          </button>
        </Form>
      </div>
    </div>
  );
}
