import type { Password, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as crypto from "crypto";

import { prisma } from "~/db.server";
import sg from "~/lib/sendgrid";

export type { User } from "@prisma/client";

export type UpdateUserData = Partial<User> & {
  password?: string;
};

export async function getUserById(id: User["id"]) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: User["email"]) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserByUsername(username: User["username"]) {
  return prisma.user.findUnique({ where: { username } });
}

export async function getActiveUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    orderBy: [{ username: "asc" }],
  });
}

export async function getInactiveUsers() {
  return prisma.user.findMany({
    where: { isActive: false },
    orderBy: [{ username: "asc" }],
  });
}

export async function createUser(
  email: User["email"],
  password: string,
  username: string
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username,
      password: {
        create: {
          hash: hashedPassword,
        },
      },
    },
  });
}

export async function updateUser(
  id: User["id"],
  { password, ...dataToUpdate }: UpdateUserData
) {
  // TODO: Figure out this type
  const dataToSend: any = { ...dataToUpdate };
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    dataToSend.password = {
      update: {
        hash: hashedPassword,
      },
    };
  }

  return prisma.user.update({
    where: { id },
    data: dataToUpdate,
  });
}

export async function deleteUserByEmail(email: User["email"]) {
  return prisma.user.delete({ where: { email } });
}

export async function verifyLogin(
  email: User["email"],
  password: Password["hash"]
) {
  const userWithPassword = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      password: true,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(
    password,
    userWithPassword.password.hash
  );

  if (!isValid) {
    return null;
  }

  const { password: _password, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

export async function activateUser(id: User["id"]) {
  return prisma.user.update({
    where: { id },
    data: { isActive: true },
  });
}

export async function deactivateUser(id: User["id"]) {
  return prisma.user.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function forgotPassword(email: User["email"], website: string) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return null;
  }

  const passwordResetHash = crypto.randomBytes(20).toString("hex");
  const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetHash,
      passwordResetExpires,
    },
  });

  const url = new URL(website);
  url.search = new URLSearchParams({
    user: user.id,
    key: passwordResetHash,
  }).toString();

  const emailMessage =
    "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
    "Click on the following link, or paste this into your browser to complete the process:\n\n" +
    url.toString() +
    "\n\n" +
    "If you did not request this, please ignore this email and your password will remain unchanged.\n";

  const msg = {
    to: user.email,
    from: "admin@thebabbles.club",
    subject: "Reset your password",
    text: emailMessage,
    html: emailMessage.replace(/(?:\r\n|\r|\n)/g, "<br>"),
  };

  try {
    await sg.send(msg);
  } catch (error) {
    console.error(error);
  }

  return true;
}
