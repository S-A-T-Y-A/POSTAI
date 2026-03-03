/*
  Warnings:

  - You are about to drop the column `media_ids` on the `post` table. All the data in the column will be lost.
  - You are about to drop the `media_asset` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `url` to the `post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "media_asset" DROP CONSTRAINT "media_asset_user_id_fkey";

-- AlterTable
ALTER TABLE "post" DROP COLUMN "media_ids",
ADD COLUMN     "url" TEXT NOT NULL;

-- DropTable
DROP TABLE "media_asset";
