/*
  Warnings:

  - A unique constraint covering the columns `[componentName]` on the table `Component` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Component_componentName_key` ON `Component`(`componentName`);
