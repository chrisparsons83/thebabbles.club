import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import * as React from "react";
import { forgotPassword } from "~/models/user.server";

import { getUserId } from "~/session.server";
import { validateEmail } from "~/utils";

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
};

interface ActionData {
  message?: string;
  errors?: {
    email?: string;
  };
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const website = new URL(request.url);

  if (!validateEmail(email)) {
    return json<ActionData>(
      { errors: { email: "Email is invalid" } },
      { status: 400 }
    );
  }

  await forgotPassword(email, website.origin);

  return json({
    message:
      "Thank you for your request. Please check your email. If there's an email on file that matches your request, you will receive an email with a link to reset your password.",
  });
};

export const meta: MetaFunction = () => {
  return {
    title: "Forgot Password",
  };
};

export default function LoginPage() {
  const actionData = useActionData() as ActionData;
  const emailRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (actionData?.errors?.email) {
      emailRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md p-8">
        {actionData?.message ?? (
          <>
            <p>
              Enter your email address below and a recovery link will be sent to
              that address.
            </p>
            <Form method="post" className="space-y-6" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    ref={emailRef}
                    id="email"
                    required
                    autoFocus={true}
                    name="email"
                    type="email"
                    autoComplete="email"
                    aria-invalid={actionData?.errors?.email ? true : undefined}
                    aria-describedby="email-error"
                    className="w-full rounded border border-gray-500 bg-base-100 px-2 py-1 text-lg"
                  />
                  {actionData?.errors?.email && (
                    <div className="pt-1 text-red-700" id="email-error">
                      {actionData.errors.email}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full rounded py-2 px-4"
              >
                Send Recovery Link
              </button>
            </Form>
          </>
        )}
      </div>
    </div>
  );
}
