/*
  Warnings:

  - A unique constraint covering the columns `[apiKey]` on the table `UserAuth` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `UserAuth_apiKey_key` ON `UserAuth`(`apiKey`);
