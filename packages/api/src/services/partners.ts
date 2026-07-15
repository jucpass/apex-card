import { Prisma, prisma } from '@apex/database';
import {
  PARTNER_MEDIA_MAX_IMAGES,
  slugify,
  type CreatePartnerInput,
  type PartnerDetails,
  type PartnerListItem,
  type PartnerListQuery,
  type PartnerListResponse,
  type PartnerMediaItem,
  type PartnerStatus,
  type UpdatePartnerInput,
} from '@apex-card/shared';

import {
  deleteObject,
  getPublicUrl,
  PARTNER_ASSETS_BUCKET,
  uploadImage,
  validateImageFile,
  type ImageValidationError,
} from '../lib/supabaseAdmin';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const partnerInclude = {
  country: { select: { name: true } },
  city: { select: { name: true } },
  categories: {
    include: { category: { select: { id: true, name: true, icon: true } } },
    orderBy: { createdAt: 'asc' as const },
  },
  media: { orderBy: { sortOrder: 'asc' as const } },
} satisfies Prisma.PartnerInclude;

type PartnerRecord = Prisma.PartnerGetPayload<{ include: typeof partnerInclude }>;
type PartnerMediaRecord = PartnerRecord['media'][number];

type PartnerRelationError =
  'DUPLICATE_SLUG' | 'COUNTRY_NOT_FOUND' | 'CITY_NOT_FOUND' | 'CITY_COUNTRY_MISMATCH';

export type CreatePartnerResult = PartnerDetails | PartnerRelationError;
export type UpdatePartnerResult = PartnerDetails | 'NOT_FOUND' | PartnerRelationError;
export type UpdatePartnerStatusResult = PartnerDetails | 'NOT_FOUND' | 'NO_MEDIA';

const toPartnerMediaItem = (media: PartnerMediaRecord): PartnerMediaItem => ({
  id: media.id,
  storagePath: media.storagePath,
  imageUrl: getPublicUrl(PARTNER_ASSETS_BUCKET, media.storagePath),
  mimeType: media.mimeType,
  isCover: media.isCover,
  sortOrder: media.sortOrder,
  createdAt: media.createdAt.toISOString(),
});

const toPartnerListItem = (partner: PartnerRecord): PartnerListItem => ({
  id: partner.id,
  name: partner.name,
  slug: partner.slug,
  email: partner.email,
  phone: partner.phone,
  whatsapp: partner.whatsapp,
  status: partner.status as PartnerStatus,
  countryId: partner.countryId,
  countryName: partner.country.name,
  cityId: partner.cityId,
  cityName: partner.city?.name ?? null,
  coverImageUrl: getPublicUrl(
    PARTNER_ASSETS_BUCKET,
    partner.media.find((item) => item.isCover)?.storagePath ?? null
  ),
  createdAt: partner.createdAt.toISOString(),
  updatedAt: partner.updatedAt.toISOString(),
});

const toPartnerDetails = (partner: PartnerRecord): PartnerDetails => ({
  ...toPartnerListItem(partner),
  description: partner.description,
  website: partner.website,
  addressLine1: partner.addressLine1,
  addressLine2: partner.addressLine2,
  postalCode: partner.postalCode,
  googleMapsUrl: partner.googleMapsUrl,
  latitude: partner.latitude === null ? null : Number(partner.latitude),
  longitude: partner.longitude === null ? null : Number(partner.longitude),
  categories: partner.categories.map((assignment) => ({
    categoryId: assignment.category.id,
    name: assignment.category.name,
    icon: assignment.category.icon,
  })),
  media: partner.media.map(toPartnerMediaItem),
});

const buildOrderBy = (
  sortBy: NonNullable<PartnerListQuery['sortBy']>,
  sortOrder: NonNullable<PartnerListQuery['sortOrder']>
): Prisma.PartnerOrderByWithRelationInput => ({ [sortBy]: sortOrder });

/** Slugs are always slugify-normalised (lowercase), so an exact unique lookup is sufficient. */
const findPartnerBySlug = (slug: string, excludeId?: string) =>
  prisma.partner.findFirst({
    where: { slug, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });

/**
 * Validates the country/city pair as a unit: the country must exist, and — when a city is
 * set — it must exist and belong to that same country. Called with the *effective* values
 * (payload value when present, otherwise the stored one) so a country change can never
 * leave a stale city from another country attached.
 */
async function validateCountryCity(
  countryId: string,
  cityId: string | null
): Promise<PartnerRelationError | null> {
  const country = await prisma.country.findUnique({
    where: { id: countryId },
    select: { id: true },
  });

  if (!country) {
    return 'COUNTRY_NOT_FOUND';
  }

  if (cityId) {
    const city = await prisma.city.findUnique({
      where: { id: cityId },
      select: { countryId: true },
    });

    if (!city) {
      return 'CITY_NOT_FOUND';
    }

    if (city.countryId !== countryId) {
      return 'CITY_COUNTRY_MISMATCH';
    }
  }

  return null;
}

export async function listPartners(query: PartnerListQuery): Promise<PartnerListResponse> {
  const page = query.page ?? DEFAULT_PAGE;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortBy = query.sortBy ?? 'name';
  const sortOrder = query.sortOrder ?? 'asc';

  const where: Prisma.PartnerWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.countryId ? { countryId: query.countryId } : {}),
    ...(query.cityId ? { cityId: query.cityId } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { phone: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { whatsapp: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const [total, partners] = await Promise.all([
    prisma.partner.count({ where }),
    prisma.partner.findMany({
      where,
      include: partnerInclude,
      orderBy: buildOrderBy(sortBy, sortOrder),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    partners: partners.map(toPartnerListItem),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getPartnerById(id: string): Promise<PartnerDetails | null> {
  const partner = await prisma.partner.findUnique({ where: { id }, include: partnerInclude });
  return partner ? toPartnerDetails(partner) : null;
}

/** New partners are always created as DRAFT — activation is a separate, explicit action. */
export async function createPartner(input: CreatePartnerInput): Promise<CreatePartnerResult> {
  const name = input.name.trim();
  const slug = slugify(input.slug?.trim() ? input.slug : name);

  if (await findPartnerBySlug(slug)) {
    return 'DUPLICATE_SLUG';
  }

  const relationError = await validateCountryCity(input.countryId, input.cityId ?? null);

  if (relationError) {
    return relationError;
  }

  const partner = await prisma.partner.create({
    data: {
      name,
      slug,
      description: input.description ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      website: input.website ?? null,
      addressLine1: input.addressLine1 ?? null,
      addressLine2: input.addressLine2 ?? null,
      postalCode: input.postalCode ?? null,
      googleMapsUrl: input.googleMapsUrl ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      countryId: input.countryId,
      cityId: input.cityId ?? null,
    },
    include: partnerInclude,
  });

  return toPartnerDetails(partner);
}

/**
 * `slug` only changes when explicitly included in the payload — a `name`-only update never
 * regenerates it, matching the slug-stability guarantee of the Categories/Cities modules.
 */
export async function updatePartner(
  id: string,
  input: UpdatePartnerInput
): Promise<UpdatePartnerResult> {
  const existing = await prisma.partner.findUnique({
    where: { id },
    select: { countryId: true, cityId: true },
  });

  if (!existing) {
    return 'NOT_FOUND';
  }

  const slug = input.slug !== undefined ? slugify(input.slug) : undefined;

  if (slug !== undefined && (await findPartnerBySlug(slug, id))) {
    return 'DUPLICATE_SLUG';
  }

  const effectiveCountryId = input.countryId ?? existing.countryId;
  const effectiveCityId = input.cityId !== undefined ? input.cityId : existing.cityId;
  const relationError = await validateCountryCity(effectiveCountryId, effectiveCityId);

  if (relationError) {
    return relationError;
  }

  const partner = await prisma.partner.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(slug !== undefined ? { slug } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.whatsapp !== undefined ? { whatsapp: input.whatsapp } : {}),
      ...(input.website !== undefined ? { website: input.website } : {}),
      ...(input.addressLine1 !== undefined ? { addressLine1: input.addressLine1 } : {}),
      ...(input.addressLine2 !== undefined ? { addressLine2: input.addressLine2 } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
      ...(input.googleMapsUrl !== undefined ? { googleMapsUrl: input.googleMapsUrl } : {}),
      ...(input.latitude !== undefined ? { latitude: input.latitude } : {}),
      ...(input.longitude !== undefined ? { longitude: input.longitude } : {}),
      ...(input.countryId !== undefined ? { countryId: input.countryId } : {}),
      ...(input.cityId !== undefined ? { cityId: input.cityId } : {}),
    },
    include: partnerInclude,
  });

  return toPartnerDetails(partner);
}

/**
 * Activate/Deactivate — the only lifecycle transitions after creation. Never deletes;
 * an INACTIVE partner keeps all data and stays editable, it is only excluded from future
 * public/mobile listings (enforced by those future consumers filtering on ACTIVE).
 *
 * Activation additionally requires at least one image — every partner shown in the mobile
 * app must have one. The one-cover invariant itself is maintained structurally by the
 * media operations below, so it needs no separate activation check.
 */
export async function updatePartnerStatus(
  id: string,
  status: 'ACTIVE' | 'INACTIVE'
): Promise<UpdatePartnerStatusResult> {
  const existing = await prisma.partner.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return 'NOT_FOUND';
  }

  if (status === 'ACTIVE') {
    const mediaCount = await prisma.partnerMedia.count({ where: { partnerId: id } });

    if (mediaCount === 0) {
      return 'NO_MEDIA';
    }
  }

  const partner = await prisma.partner.update({
    where: { id },
    data: { status },
    include: partnerInclude,
  });

  return toPartnerDetails(partner);
}

// --- Partner media ---

export type UploadPartnerMediaResult =
  PartnerDetails | 'NOT_FOUND' | 'MEDIA_LIMIT_EXCEEDED' | ImageValidationError;
export type DeletePartnerMediaResult =
  PartnerDetails | 'NOT_FOUND' | 'MEDIA_NOT_FOUND' | 'LAST_IMAGE_ACTIVE';
export type ReplacePartnerMediaResult =
  PartnerDetails | 'NOT_FOUND' | 'MEDIA_NOT_FOUND' | ImageValidationError;
export type SetPartnerCoverResult = PartnerDetails | 'NOT_FOUND' | 'MEDIA_NOT_FOUND';

const refreshedDetails = async (id: string): Promise<PartnerDetails> => {
  const partner = await prisma.partner.findUniqueOrThrow({
    where: { id },
    include: partnerInclude,
  });
  return toPartnerDetails(partner);
};

/** Returns the media record only when it exists AND belongs to the given partner. */
const findOwnedMedia = (partnerId: string, mediaId: string) =>
  prisma.partnerMedia.findFirst({ where: { id: mediaId, partnerId } });

/**
 * Uploads 1..N images. Enforces the 3-image cap counting existing records, validates each
 * file (MIME + size, never the filename), and makes the very first image the cover.
 * Storage objects are uploaded first; if the DB write then fails, the fresh objects are
 * deleted (compensating cleanup), so a failed request never leaves untracked files or
 * invalid records.
 */
export async function uploadPartnerMedia(
  partnerId: string,
  files: { buffer: Buffer; mimetype: string; size: number }[]
): Promise<UploadPartnerMediaResult> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { id: true },
  });

  if (!partner) {
    return 'NOT_FOUND';
  }

  for (const file of files) {
    const validationError = validateImageFile(file);

    if (validationError) {
      return validationError;
    }
  }

  const existing = await prisma.partnerMedia.findMany({
    where: { partnerId },
    select: { sortOrder: true },
    orderBy: { sortOrder: 'desc' },
    take: 1,
  });
  const existingCount = await prisma.partnerMedia.count({ where: { partnerId } });

  if (existingCount + files.length > PARTNER_MEDIA_MAX_IMAGES) {
    return 'MEDIA_LIMIT_EXCEEDED';
  }

  const uploadedPaths: string[] = [];

  try {
    for (const file of files) {
      uploadedPaths.push(await uploadImage(PARTNER_ASSETS_BUCKET, `partners/${partnerId}`, file));
    }

    const nextSortStart = (existing[0]?.sortOrder ?? -1) + 1;

    await prisma.$transaction(
      uploadedPaths.map((storagePath, index) =>
        prisma.partnerMedia.create({
          data: {
            partnerId,
            storagePath,
            mimeType: files[index]?.mimetype ?? 'application/octet-stream',
            sortOrder: nextSortStart + index,
            isCover: existingCount === 0 && index === 0,
          },
        })
      )
    );
  } catch (error) {
    // Compensating cleanup: never leave Storage objects the database doesn't know about.
    for (const storagePath of uploadedPaths) {
      void deleteObject(PARTNER_ASSETS_BUCKET, storagePath);
    }
    throw error;
  }

  return refreshedDetails(partnerId);
}

/**
 * Deletes one image. An ACTIVE partner must keep at least one image (deactivate first).
 * If the cover is removed, the remaining image with the lowest sortOrder is promoted in
 * the same transaction. The Storage object is deleted only after the DB commit succeeds.
 */
export async function deletePartnerMedia(
  partnerId: string,
  mediaId: string
): Promise<DeletePartnerMediaResult> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { status: true },
  });

  if (!partner) {
    return 'NOT_FOUND';
  }

  const media = await findOwnedMedia(partnerId, mediaId);

  if (!media) {
    return 'MEDIA_NOT_FOUND';
  }

  const totalCount = await prisma.partnerMedia.count({ where: { partnerId } });

  if (partner.status === 'ACTIVE' && totalCount === 1) {
    return 'LAST_IMAGE_ACTIVE';
  }

  await prisma.$transaction(async (tx) => {
    await tx.partnerMedia.delete({ where: { id: mediaId } });

    if (media.isCover) {
      const nextCover = await tx.partnerMedia.findFirst({
        where: { partnerId },
        orderBy: { sortOrder: 'asc' },
        select: { id: true },
      });

      if (nextCover) {
        await tx.partnerMedia.update({ where: { id: nextCover.id }, data: { isCover: true } });
      }
    }
  });

  void deleteObject(PARTNER_ASSETS_BUCKET, media.storagePath);

  return refreshedDetails(partnerId);
}

/**
 * Replaces an image in place: same record (cover status and sortOrder preserved), new
 * Storage object. The old object is deleted only after the DB update succeeds; if the DB
 * update fails, the freshly uploaded object is removed instead.
 */
export async function replacePartnerMedia(
  partnerId: string,
  mediaId: string,
  file: { buffer: Buffer; mimetype: string; size: number }
): Promise<ReplacePartnerMediaResult> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { id: true },
  });

  if (!partner) {
    return 'NOT_FOUND';
  }

  const media = await findOwnedMedia(partnerId, mediaId);

  if (!media) {
    return 'MEDIA_NOT_FOUND';
  }

  const validationError = validateImageFile(file);

  if (validationError) {
    return validationError;
  }

  const newPath = await uploadImage(PARTNER_ASSETS_BUCKET, `partners/${partnerId}`, file);

  try {
    await prisma.partnerMedia.update({
      where: { id: mediaId },
      data: { storagePath: newPath, mimeType: file.mimetype },
    });
  } catch (error) {
    void deleteObject(PARTNER_ASSETS_BUCKET, newPath);
    throw error;
  }

  void deleteObject(PARTNER_ASSETS_BUCKET, media.storagePath);

  return refreshedDetails(partnerId);
}

/** Sets the cover atomically: unsets every other record, sets the target, one transaction. */
export async function setPartnerMediaCover(
  partnerId: string,
  mediaId: string
): Promise<SetPartnerCoverResult> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { id: true },
  });

  if (!partner) {
    return 'NOT_FOUND';
  }

  const media = await findOwnedMedia(partnerId, mediaId);

  if (!media) {
    return 'MEDIA_NOT_FOUND';
  }

  await prisma.$transaction([
    prisma.partnerMedia.updateMany({ where: { partnerId }, data: { isCover: false } }),
    prisma.partnerMedia.update({ where: { id: mediaId }, data: { isCover: true } }),
  ]);

  return refreshedDetails(partnerId);
}

export type UpdatePartnerCategoriesResult = PartnerDetails | 'NOT_FOUND' | 'CATEGORY_NOT_FOUND';

/**
 * Full-set replace of a partner's category assignments — idempotent, and the
 * `@@unique([partnerId, categoryId])` constraint plus `skipDuplicates` make duplicate
 * relationships structurally impossible. Every id must reference an existing category.
 */
export async function updatePartnerCategories(
  partnerId: string,
  categoryIds: string[]
): Promise<UpdatePartnerCategoriesResult> {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { id: true },
  });

  if (!partner) {
    return 'NOT_FOUND';
  }

  if (categoryIds.length > 0) {
    const existingCount = await prisma.category.count({ where: { id: { in: categoryIds } } });

    if (existingCount !== categoryIds.length) {
      return 'CATEGORY_NOT_FOUND';
    }
  }

  await prisma.$transaction([
    prisma.partnerCategory.deleteMany({
      where: { partnerId, categoryId: { notIn: categoryIds } },
    }),
    prisma.partnerCategory.createMany({
      data: categoryIds.map((categoryId) => ({ partnerId, categoryId })),
      skipDuplicates: true,
    }),
  ]);

  return refreshedDetails(partnerId);
}
