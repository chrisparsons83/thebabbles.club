import { ActionFunction, json, LoaderFunction } from "@remix-run/node";
import invariant from "tiny-invariant";
import { requireActiveUser } from "~/session.server";
import type { PostWithMessages } from "~/models/post.server";
import { createMessage, Message } from "~/models/message.server";
import { getPost } from "~/models/post.server";
import { useLoaderData } from "@remix-run/react";
import MessageComponent from "~/components/Message";
import MessageForm from "~/components/MessageForm";

type LoaderData = {
  post: PostWithMessages;
};

type ActionData = {
  formError?: string;
  fields?: {
    text?: string;
    postId?: string;
    parentId?: string | null;
  };
  errors?: {
    text?: string;
    postId?: string;
    parentId?: string;
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
  let parentId = formData.get("parentId");

  if (
    typeof text !== "string" ||
    typeof postId !== "string" ||
    typeof parentId !== "string"
  ) {
    return json<ActionData>(
      { formError: "Form was not submitted correctly." },
      { status: 400 }
    );
  }

  const errors = {
    text: validateText(text),
    postId: validatePostId(postId),
  };

  if (parentId === "") parentId = null;
  const fields = { text, postId, parentId };
  console.log(fields);

  if (Object.values(errors).some(Boolean)) {
    return json<ActionData>({ errors, fields }, { status: 400 });
  }

  const message = await createMessage({ userId, text, postId, parentId });

  return json<ActionData>({ message });
};

export const loader: LoaderFunction = async ({ request, params }) => {
  await requireActiveUser(request);
  invariant(params.postId, "postId not found");

  const post = await getPost({ id: params.postId });
  if (!post) {
    throw new Response("Not Found", { status: 404 });
  }
  return json<LoaderData>({ post });
};

export default function PostPage() {
  const data = useLoaderData() as LoaderData;

  if (!data.post) {
    return null;
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{data.post.title}</h1>
      <img src={data.post.gif} alt={data.post.title} className="mb-4" />
      <MessageForm id={data.post.id} />
      {data.post.messages.map((message) => (
        <MessageComponent message={message} depth={0} key={message.id} />
      ))}
    </div>
  );
}
