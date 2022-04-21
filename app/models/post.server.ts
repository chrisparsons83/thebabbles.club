import type { User, Post, Prisma } from "@prisma/client";
import { prisma } from "~/db.server";
export type { Post } from "@prisma/client";

export type PostWithMessages = Prisma.PromiseReturnType<typeof getPost>;

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
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          likes: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });
}

export function getPosts(take = 10, previousCursor?: string) {
  let skip = 0;
  let cursor;
  if (previousCursor) {
    skip = 1;
    cursor = {
      id: previousCursor,
    };
  }

  return prisma.post.findMany({
    take,
    skip,
    cursor,
    orderBy: { createdAt: "desc" },
  });
}
