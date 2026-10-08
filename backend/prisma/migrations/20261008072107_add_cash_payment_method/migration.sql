-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'CASH');

-- AlterTable
ALTER TABLE "MonthlyContribution" ADD COLUMN     "paymentMethod" "PaymentMethod";

-- AlterTable
ALTER TABLE "PaymentVerification" ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'ONLINE',
ALTER COLUMN "screenshotUrl" DROP NOT NULL;
