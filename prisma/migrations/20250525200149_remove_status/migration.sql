/*
  Warnings:

  - You are about to drop the column `status` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "status";

-- DropEnum
DROP TYPE "SaleStatus";
