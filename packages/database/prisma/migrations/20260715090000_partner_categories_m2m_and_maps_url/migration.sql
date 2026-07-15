-- Partner <-> Category becomes many-to-many via an explicit join table, and Partner gains
-- an optional Google Maps URL. Any existing single-category assignment is copied into the
-- join table before the old column is dropped (verified NULL-only at authoring time, but
-- the copy keeps the migration safe against any data state).
CREATE TABLE "PartnerCategory" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PartnerCategory_partnerId_categoryId_key" ON "PartnerCategory"("partnerId", "categoryId");
CREATE INDEX "PartnerCategory_categoryId_idx" ON "PartnerCategory"("categoryId");

ALTER TABLE "PartnerCategory" ADD CONSTRAINT "PartnerCategory_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerCategory" ADD CONSTRAINT "PartnerCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "PartnerCategory" ("id", "partnerId", "categoryId")
SELECT gen_random_uuid()::text, "id", "categoryId" FROM "Partner" WHERE "categoryId" IS NOT NULL;

DROP INDEX IF EXISTS "Partner_categoryId_idx";
ALTER TABLE "Partner" DROP COLUMN "categoryId";

ALTER TABLE "Partner" ADD COLUMN "googleMapsUrl" TEXT;
