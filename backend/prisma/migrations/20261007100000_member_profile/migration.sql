-- Member profile: phone number (stored as text) and optional Cloudinary profile photo URL.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT,
ADD COLUMN IF NOT EXISTS "profileImageUrl" TEXT;

-- Keep any phone numbers saved in the old "phone" column, then remove the duplicate column.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'phone') THEN
    UPDATE "User" SET "phoneNumber" = "phone" WHERE "phoneNumber" IS NULL AND "phone" IS NOT NULL;
    ALTER TABLE "User" DROP COLUMN "phone";
  END IF;
END $$;
