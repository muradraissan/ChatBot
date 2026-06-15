/*
  Warnings:

  - A unique constraint covering the columns `[phoneNumber,workspaceId]` on the table `Contact` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workspaceId` to the `AgentAssignment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `Contact` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workspaceId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Contact_phoneNumber_key";

-- AlterTable
ALTER TABLE "AgentAssignment" ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "workspaceId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE INDEX "AgentAssignment_workspaceId_idx" ON "AgentAssignment"("workspaceId");

-- CreateIndex
CREATE INDEX "Contact_workspaceId_idx" ON "Contact"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_phoneNumber_workspaceId_key" ON "Contact"("phoneNumber", "workspaceId");

-- CreateIndex
CREATE INDEX "Message_workspaceId_idx" ON "Message"("workspaceId");

-- CreateIndex
CREATE INDEX "User_workspaceId_idx" ON "User"("workspaceId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAssignment" ADD CONSTRAINT "AgentAssignment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
