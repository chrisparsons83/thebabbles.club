/*
  Warnings:

  - A unique constraint covering the columns `[emoji,userId,messageId]` on the table `Like` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Like_emoji_userId_messageId_key" ON "Like"("emoji", "userId", "messageId");
