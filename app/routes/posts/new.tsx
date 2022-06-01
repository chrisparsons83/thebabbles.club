import { useEffect, useRef, useState } from "react";
import type {
  ActionFunction,
  LoaderFunction,
  UploadHandler,
} from "@remix-run/node";
import { unstable_parseMultipartFormData } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { requireActiveUser } from "~/session.server";
import { createPost } from "~/models/post.server";
import { hasSecureUrl, uploadImage, uploadImageURL } from "~/cloudinary.server";
import clsx from "clsx";

type ActionData = {
  formError?: string;
  fields?: {
    title?: string;
    gif?: string;
    gifURL?: string;
  };
  errors?: {
    title?: string;
    gif?: string;
    gifURL?: string;
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

  const uploadHandler: UploadHandler = async ({ name, stream, filename }) => {
    if (name !== "gif" || (name === "gif" && !filename)) {
      stream.resume();
      return;
    }
    const uploadedImage = await uploadImage(stream, "posts").catch((err) =>
      console.error(err)
    );
    return hasSecureUrl(uploadedImage) ? uploadedImage.secure_url : "";
  };

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  const title = formData.get("title");
  const gif = formData.get("gif");
  const gifURL = formData.get("gifURL");
  const fileUploadType = formData.get("fileUploadType");

  if (
    typeof title !== "string" ||
    (fileUploadType === "URL" &&
      (typeof gifURL !== "string" || gifURL === "")) ||
    (fileUploadType === "file" && typeof gif !== "string")
  ) {
    return json<ActionData>(
      { formError: "Form was not submitted correctly." },
      { status: 400 }
    );
  }

  console.log({ title, gif, gifURL, fileUploadType });

  let image = fileUploadType === "URL" ? `${gifURL}` : `${gif}`;

  const errors: ActionData["errors"] = {
    title: validateTitle(title),
  };
  const fields: ActionData["fields"] = { title };
  if (fileUploadType === "file") {
    errors.gif = validateGif(image);
    fields.gif = image;
  }
  if (fileUploadType === "URL") {
    errors.gifURL = validateGif(image);
    fields.gifURL = image;
  }
  if (Object.values(errors).some(Boolean)) {
    return json<ActionData>({ errors, fields }, { status: 400 });
  }

  if (fileUploadType === "URL") {
    const result = await uploadImageURL(image);
    if (!result) {
      return json<ActionData>(
        { formError: "There was an issue uploading the file." },
        { status: 400 }
      );
    }
    image = result.secure_url;
  }

  const post = await createPost({ title, gif: image, userId });

  return redirect(`/posts/${post.id}`);
};

export default function NewPostPage() {
  const actionData = useActionData<ActionData>();
  const titleRef = useRef<HTMLInputElement>(null);
  const gifRef = useRef<HTMLInputElement>(null);
  const gifURLRef = useRef<HTMLInputElement>(null);
  const [gifView, setGifView] = useState("URL");

  useEffect(() => {
    if (actionData?.errors?.title) {
      titleRef.current?.focus();
    } else if (actionData?.errors?.gif) {
      gifRef.current?.focus();
    }
  }, [actionData]);

  const handleFormToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    setGifView(event.currentTarget.value);
  };

  return (
    <div>
      <h1>New Post</h1>
      <Form method="post" encType="multipart/form-data">
        <div className="mb-4">
          <label htmlFor="title">
            Title:
            <input
              type="text"
              name="title"
              defaultValue={actionData?.fields?.title}
              ref={titleRef}
              className="block dark:text-black"
            />
            {actionData?.errors?.title && (
              <div className="pt-1 text-red-700" id="title-error">
                {actionData.errors.title}
              </div>
            )}
          </label>
        </div>

        <div>
          <label htmlFor="postImageToggle">
            Upload Image Method:
            <div className="btn-group">
              <button
                className={clsx(
                  "btn",
                  "btn-sm",
                  gifView === "URL" && "btn-active"
                )}
                name="fileUploadType"
                value="URL"
                type="button"
                onClick={handleFormToggle}
              >
                URL
              </button>
              <button
                className={clsx(
                  "btn",
                  "btn-sm",
                  gifView === "file" && "btn-active"
                )}
                name="fileUploadType"
                value="file"
                type="button"
                onClick={handleFormToggle}
              >
                File Upload
              </button>
            </div>
          </label>
        </div>

        <div>
          {gifView === "file" && (
            <label htmlFor="gif">
              Post Image:
              <input
                type="file"
                name="gif"
                accept="image/*"
                ref={gifRef}
                className="block"
              />
            </label>
          )}
          {gifView === "URL" && (
            <label htmlFor="gifURL">
              Post Image:
              <input
                type="text"
                name="gifURL"
                ref={gifURLRef}
                className="block dark:text-black"
              />
            </label>
          )}
          {actionData?.errors?.gif && (
            <div className="pt-1 text-red-700" id="gif-error">
              {actionData.errors.gif}
            </div>
          )}
          {actionData?.errors?.gifURL && (
            <div className="pt-1 text-red-700" id="gifURL-error">
              {actionData.errors.gifURL}
            </div>
          )}
        </div>

        <div>
          {actionData?.formError ? (
            <p className="form-validation-error" role="alert">
              {actionData.formError}
            </p>
          ) : null}
          <input type="hidden" name="fileUploadType" value={gifView} />
          <button type="submit" className="btn btn-primary mt-4">
            Post
          </button>
        </div>
      </Form>
    </div>
  );
}
