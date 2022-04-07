import type { Message } from "@prisma/client";
import { ActionFunction, json } from "@remix-run/node";
import { createMessage } from "~/models/message.server";
import { requireActiveUser } from "~/session.server";

type ActionData = {
  formError?: string;
  fields?: {
    text?: string;
    postId?: string;
  };
  errors?: {
    text?: string;
    postId?: string;
  };
  message?: Message;
};

function validateText(text: string) {
  if (typeof text !== "string" || text.length === 0) {
    return "Message is required";
  }
}

function validatePostId(postId: string) {
  // TODO: Check that this is actually a post ID?
  if (typeof postId !== "string" || postId.length === 0) {
    return "Post is required";
  }
}

export const action: ActionFunction = async ({ request }) => {
  const { id: userId } = await requireActiveUser(request);

  const formData = await request.formData();
  const text = formData.get("text");
  const postId = formData.get("postId");

  if (typeof text !== "string" || typeof postId !== "string") {
    return json<ActionData>(
      { formError: "Form was not submitted correctly." },
      { status: 400 }
    );
  }

  const errors = {
    text: validateText(text),
    postId: validatePostId(postId),
  };
  const fields = { text, postId };
  if (Object.values(errors).some(Boolean)) {
    return json<ActionData>({ errors, fields }, { status: 400 });
  }

  const message = await createMessage({ userId, text, postId });

  return json<ActionData>({ message });
};
