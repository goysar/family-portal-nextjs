-- CreateTable
CREATE TABLE "_Siblings" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_Siblings_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_Siblings_B_index" ON "_Siblings"("B");

-- AddForeignKey
ALTER TABLE "_Siblings" ADD CONSTRAINT "_Siblings_A_fkey" FOREIGN KEY ("A") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Siblings" ADD CONSTRAINT "_Siblings_B_fkey" FOREIGN KEY ("B") REFERENCES "FamilyMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
