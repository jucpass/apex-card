-- PartnerMedia replaces the never-used Partner.logo/coverImage columns as the single
-- source of truth for partner images. Verified before authoring: no code references
-- either column and every stored value is NULL, so dropping them loses nothing.
ALTER TABLE "Partner" DROP COLUMN "logo";
ALTER TABLE "Partner" DROP COLUMN "coverImage";

CREATE TABLE "PartnerMedia" (
    "id" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "partnerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PartnerMedia_partnerId_idx" ON "PartnerMedia"("partnerId");

ALTER TABLE "PartnerMedia" ADD CONSTRAINT "PartnerMedia_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
