import type { Like, Message, Prisma, User } from "@prisma/client";
import { prisma } from "~/db.server";
export type { Like } from "@prisma/client";

export type LikeWithUser = Prisma.PromiseReturnType<typeof getLike>;

type CreateLikeInput = {
  userId: User["id"];
  messageId: Message["id"];
  emoji: Like["emoji"];
};

export function createLike({ emoji, messageId, userId }: CreateLikeInput) {
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

export function getLike({ id }: Pick<Like, "id">) {
  return prisma.like.findFirst({
    where: { id },
    include: {
      user: true,
      message: true,
    },
  });
}

export function findLikeByUserAndMessage({
  userId,
  messageId,
  emoji,
}: Pick<Like, "userId" | "messageId" | "emoji">) {
  return prisma.like.findFirst({
    where: {
      user: {
        id: userId,
      },
      message: {
        id: messageId,
      },
      emoji,
    },
    include: {
      user: true,
      message: true,
    },
  });
}

export function deleteLike({ id }: Pick<Like, "id">) {
  return prisma.like.delete({
    where: {
      id,
    },
  });
}
