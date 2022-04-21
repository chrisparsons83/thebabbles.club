import { Like, Message, User } from "@prisma/client";
import { prisma } from "~/db.server";
export type { Like } from "@prisma/client";

type CreateLikeInput = {
  userId: User["id"];
  messageId: Message["id"];
  emoji: Like["emoji"];
};

export function createLike({ emoji, messageId, userId }: CreateLikeInput) {
  console.log({ test: "createLike", emoji, messageId, userId });
  return prisma.like.create({
    data: {
      emoji,
      message: {
        connect: {
          id: messageId,
        },
      },
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}
