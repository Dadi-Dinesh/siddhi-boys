-- CreateEnum
CREATE TYPE "BorrowedStatus" AS ENUM ('BORROWED', 'RETURNED');

-- CreateTable
CREATE TABLE "Borrowed" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "borrowedAt" DATE NOT NULL,
    "purpose" TEXT,
    "status" "BorrowedStatus" NOT NULL DEFAULT 'BORROWED',
    "returnedAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Borrowed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Borrowed_memberId_idx" ON "Borrowed"("memberId");

-- CreateIndex
CREATE INDEX "Borrowed_status_idx" ON "Borrowed"("status");

-- AddForeignKey
ALTER TABLE "Borrowed" ADD CONSTRAINT "Borrowed_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

