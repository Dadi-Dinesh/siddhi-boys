-- CreateEnum
CREATE TYPE "PaymentVerificationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "SubmitterRole" AS ENUM ('MEMBER', 'ADMIN');

-- AlterTable
ALTER TABLE "GroupSettings" ADD COLUMN     "dueDay" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "fineAmount" DECIMAL(10,2) NOT NULL DEFAULT 20,
ALTER COLUMN "groupName" SET DEFAULT 'SiddhiBoys';

-- AlterTable
ALTER TABLE "MonthlyContribution" ADD COLUMN     "dueDate" DATE,
ADD COLUMN     "fineAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "lateFine" DECIMAL(10,2) NOT NULL DEFAULT 20,
ADD COLUMN     "paymentDate" DATE,
ADD COLUMN     "totalPaidAmount" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "PaymentVerification" (
    "id" TEXT NOT NULL,
    "contributionId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "submittedByRole" "SubmitterRole" NOT NULL DEFAULT 'MEMBER',
    "screenshotUrl" TEXT NOT NULL,
    "paymentDate" DATE,
    "fineAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2),
    "status" "PaymentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentVerification_contributionId_idx" ON "PaymentVerification"("contributionId");

-- CreateIndex
CREATE INDEX "PaymentVerification_status_idx" ON "PaymentVerification"("status");

-- CreateIndex
CREATE INDEX "PaymentVerification_submittedById_idx" ON "PaymentVerification"("submittedById");

-- AddForeignKey
ALTER TABLE "PaymentVerification" ADD CONSTRAINT "PaymentVerification_contributionId_fkey" FOREIGN KEY ("contributionId") REFERENCES "MonthlyContribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVerification" ADD CONSTRAINT "PaymentVerification_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVerification" ADD CONSTRAINT "PaymentVerification_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

