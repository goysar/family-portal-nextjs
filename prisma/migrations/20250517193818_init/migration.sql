/*
  Warnings:

  - You are about to drop the column `timestamp` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `currentLocation` on the `FamilyMember` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfDeath` on the `FamilyMember` table. All the data in the column will be lost.
  - You are about to drop the column `hobbies` on the `FamilyMember` table. All the data in the column will be lost.
  - You are about to drop the column `occupation` on the `FamilyMember` table. All the data in the column will be lost.
  - You are about to drop the column `photoUrl` on the `FamilyMember` table. All the data in the column will be lost.
  - You are about to drop the `_ParentChild` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_ParentChild" DROP CONSTRAINT "_ParentChild_A_fkey";

-- DropForeignKey
ALTER TABLE "_ParentChild" DROP CONSTRAINT "_ParentChild_B_fkey";

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "FamilyMember" DROP COLUMN "currentLocation",
DROP COLUMN "dateOfDeath",
DROP COLUMN "hobbies",
DROP COLUMN "occupation",
DROP COLUMN "photoUrl",
ADD COLUMN     "fatherId" TEXT,
ADD COLUMN     "motherId" TEXT,
ALTER COLUMN "placeOfBirth" DROP NOT NULL;

-- DropTable
DROP TABLE "_ParentChild";

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "FamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
