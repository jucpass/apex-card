-- Additive, data-preserving: every new column has a safe default, so existing
-- countries become "not yet available for Partners / not yet visible in Explore"
-- rather than being silently exposed.
ALTER TABLE "Country" ADD COLUMN "availableForPartners" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Country" ADD COLUMN "visibleInExplore" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Country" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Country" ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Country" ADD COLUMN "region" TEXT;
ALTER TABLE "Country" ADD COLUMN "imagePath" TEXT;
ALTER TABLE "Country" ADD COLUMN "imageAltText" TEXT;

CREATE INDEX "Country_availableForPartners_idx" ON "Country"("availableForPartners");
CREATE INDEX "Country_visibleInExplore_idx" ON "Country"("visibleInExplore");
