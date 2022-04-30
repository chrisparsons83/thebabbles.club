import { useEffect, useRef } from "react";
import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { requireActiveUser } from "~/session.server";
import { createNote } from "~/models/post.server";

type ActionData = {
  formError?: string;
  fields?: {
    title?: string;
    gif?: string;
  };
  errors?: {
    title?: string;
    gif?: string;
  };
};

function validateTitle(title: string) {
  if (typeof title !== "string" || title.length === 0) {
    return "Title is required";
  }
}

function validateGif(inputUrl: string) {
  let url;

  try {
    url = new URL(inputUrl);
  } catch (_) {
    return "Invalid URL";
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return "Invalid URL";
  }
}

export const loader: LoaderFunction = async ({ request }) => {
  await requireActiveUser(request);
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const { id: userId } = await requireActiveUser(request);

  const formData = await request.formData();
  const title = formData.get("title");
  const gif = formData.get("gif");

  if (typeof title !== "string" || typeof gif !== "string") {
    return json<ActionData>(
      { formError: "Form was not submitted correctly." },
      { status: 400 }
    );
  }

  const errors = {
    title: validateTitle(title),
    gif: validateGif(gif),
  };
  const fields = { title, gif };
  if (Object.values(errors).some(Boolean)) {
    return json<ActionData>({ errors, fields }, { status: 400 });
  }

  const post = await createNote({ title, gif, userId });

  return redirect(`/posts/${post.id}`);
};

export default function NewPostPage() {
  const actionData = useActionData<ActionData>();
  const titleRef = useRef<HTMLInputElement>(null);
  const gifRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (actionData?.errors?.title) {
      titleRef.current?.focus();
    } else if (actionData?.errors?.gif) {
      gifRef.current?.focus();
    }
  }, [actionData]);

  return (
    <div>
      <h1>New Post</h1>
      <Form method="post">
        <div>
          <label htmlFor="title">
            Title:
            <input
              type="text"
              name="title"
              defaultValue={actionData?.fields?.title}
              ref={titleRef}
              className="block"
            />
            {actionData?.errors?.title && (
              <div className="pt-1 text-red-700" id="title-error">
                {actionData.errors.title}
              </div>
            )}
          </label>
        </div>

        <div>
          <label htmlFor="gif">
            Post Image:
            <input
              type="text"
              name="gif"
              defaultValue={actionData?.fields?.gif}
              ref={gifRef}
              className="block"
            />
            {actionData?.errors?.gif && (
              <div className="pt-1 text-red-700" id="gif-error">
                {actionData.errors.gif}
              </div>
            )}
          </label>
        </div>

        <div>
          {actionData?.formError ? (
            <p className="form-validation-error" role="alert">
              {actionData.formError}
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary mt-4">
            Post
          </button>
        </div>
      </Form>
    </div>
  );
}
