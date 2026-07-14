-- CreateIndex
CREATE INDEX `Chat_originId_createdAt_idx` ON `Chat`(`originId`, `createdAt`);

-- CreateIndex
CREATE INDEX `Chat_recipientId_idx` ON `Chat`(`recipientId`);
