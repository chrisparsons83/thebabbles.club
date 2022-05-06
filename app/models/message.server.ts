import type { Message, User, Post, Prisma } from "@prisma/client";
import { prisma } from "~/db.server";
export type { Message } from "@prisma/client";

export type MessageWithUser = Prisma.PromiseReturnType<typeof getMessage>;

type CreateMessageInput = {
  text: Message["text"];
  userId: User["id"];
  postId: Post["id"];
  parentId: Message["parentId"];
};

export function createMessage({
  text,
  userId,
  postId,
  parentId,
}: CreateMessageInput) {
  // TODO: Figure out what the hell this type is
  const messageToCreate: any = {
    data: {
      text,
      user: {
        connect: {
          id: userId,
        },
      },
      post: {
        connect: {
          id: postId,
        },
      },
    },
  };

  if (parentId !== null) {
    messageToCreate.data.parent = {
      connect: {
        id: parentId,
      },
    };
  }

  return prisma.message.create(messageToCreate);
}

export function updateMessage(id: Message["id"], text: Message["text"]) {
  const data: Prisma.MessageUpdateInput = {
    text,
  };
  return prisma.message.update({
    where: { id },
    data,
  });
}

export function getMessage({ id }: Pick<Message, "id">) {
  return prisma.message.findFirst({
    where: { id },
    include: {
      user: true,
      likes: {
        include: {
          user: true,
        },
      },
    },
  });
}
