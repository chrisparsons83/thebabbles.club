import type { Message, User, Post } from "@prisma/client";
import { prisma } from "~/db.server";
export type { Message } from "@prisma/client";

export function createMessage({
  text,
  userId,
  postId,
}: Pick<Message, "text"> & {
  userId: User["id"];
} & {
  postId: Post["id"];
}) {
  return prisma.message.create({
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
  });
}
