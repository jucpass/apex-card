-- Additive/relaxing only — no data loss. The Partner table is empty at migration time,
-- but both statements would also be safe against existing rows.
ALTER TABLE "Partner" ADD COLUMN "whatsapp" TEXT;
ALTER TABLE "Partner" ALTER COLUMN "categoryId" DROP NOT NULL;
