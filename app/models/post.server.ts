import type { User, Post } from "@prisma/client";
import { prisma } from "~/db.server";
export type { Post } from "@prisma/client";

export function createNote({
  title,
  gif,
  userId,
}: Pick<Post, "title" | "gif"> & {
  userId: User["id"];
}) {
  return prisma.post.create({
    data: {
      title,
      gif,
      user: {
        connect: {
          id: userId,
        },
      },
    },
  });
}

export function getPost({ id }: Pick<Post, "id">) {
  return prisma.post.findFirst({
    where: { id },
  });
}
