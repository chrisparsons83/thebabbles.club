import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import {
  json,
  unstable_composeUploadHandlers,
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { hasSecureUrl, uploadImage } from "~/cloudinary.server";
import type { UpdateUserData, User } from "~/models/user.server";
import { updateUser } from "~/models/user.server";
import { requireActiveUser } from "~/session.server";

type ActionData = {
  error?: string;
  response?: string;
};

export const action: ActionFunction = async ({ request }) => {
  const currentUser = await requireActiveUser(request);

  const uploadHandler = unstable_composeUploadHandlers(
    async ({ name, data, filename }) => {
      if (name !== "avatar" || !filename) {
        // Let the memory handler capture text fields (email/password/etc.)
        return undefined;
      }
      const uploadedImage = await uploadImage(data, "avatars").catch((err) =>
        console.error(err)
      );
      return hasSecureUrl(uploadedImage) ? uploadedImage.secure_url : "";
    },
    unstable_createMemoryUploadHandler()
  );

  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );

  const email = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const avatar = formData.get("avatar");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    return json<ActionData>({ error: "Form was not submitted correctly." });
  }

  if (password !== confirmPassword) {
    return json<ActionData>({ error: "Passwords do not match." });
  }

  if (password.length > 0 && password.length < 8) {
    return json<ActionData>({ error: "Password is too short." });
  }

  const fieldsToUpdate: UpdateUserData = {};
  if (email) {
    fieldsToUpdate.email = email;
  }
  if (typeof avatar === "string" && avatar.length > 0) {
    fieldsToUpdate.avatar = avatar.replace(
      "image/upload",
      "image/upload/c_fill,h_64,w_64,q_auto:best"
    );
  }
  if (password && password.length > 0) {
    fieldsToUpdate.password = password;
  }

  await updateUser(currentUser.id, fieldsToUpdate);

  return json<ActionData>({ response: "The user has been updated." });
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const currentUser = await requireActiveUser(request);

  if (currentUser.id !== params.userId) throw new Error("Unauthorized");

  return json<User>(currentUser);
};

export default function UserEditPath() {
  const { username, email } = useLoaderData<User>();
  const actionData = useActionData() as ActionData;

  const error = actionData?.error;
  const response = actionData?.response;

  return (
    <>
      <h1>Editing User {username}</h1>
      {response && <div className="alert alert-success mb-4">{response}</div>}
      {error && <div className="alert alert-error mb-4">{error}</div>}
      <Form method="post" className="space-y-6" encType="multipart/form-data">
        <div>
          <label>Email Address</label>
          <div className="mt-1">
            <input type="email" name="email" defaultValue={email} />
          </div>
        </div>
        <div>
          <label>Password</label>
          <div className="mt-1">
            <input type="password" name="password" />
          </div>
        </div>
        <div>
          <label>Confirm Password</label>
          <div className="mt-1">
            <input type="password" name="confirmPassword" />
          </div>
        </div>
        <div>
          <label>Avatar</label>
          <div className="mt-1">
            <input type="file" name="avatar" accept="image/*" />
          </div>
        </div>
        <div>
          <button type="submit" className="btn btn-primary">
            Update
          </button>
        </div>
      </Form>
    </>
  );
}
