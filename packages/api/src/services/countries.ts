import { Prisma, prisma } from '@apex/database';
import type {
  CountriesResponse,
  CountryDetails,
  CountryListQuery,
  CountryListResponse,
  CountryRegion,
  CreateCountryInput,
  UpdateCountryAvailabilityInput,
  UpdateCountryInput,
} from '@apex-card/shared';

import {
  deleteCountryImage,
  getCountryImageUrl,
  uploadCountryImage,
  validateCountryImageFile,
  type CountryImageValidationError,
} from '../lib/supabaseAdmin';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const countrySelect = {
  id: true,
  name: true,
  code: true,
  phoneCode: true,
  currency: true,
  active: true,
  availableForPartners: true,
  visibleInExplore: true,
  featured: true,
  displayOrder: true,
  region: true,
  imagePath: true,
  imageAltText: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CountrySelect;

type CountryRecord = Prisma.CountryGetPayload<{ select: typeof countrySelect }>;

export type CreateCountryResult = CountryDetails | 'DUPLICATE_NAME';
export type UpdateCountryResult = CountryDetails | 'NOT_FOUND' | 'DUPLICATE_NAME';
export type UpdateCountryStatusResult = CountryDetails | 'NOT_FOUND';
export type UpdateCountryAvailabilityResult =
  CountryDetails | 'NOT_FOUND' | 'EXPLORE_REQUIRES_ACTIVE' | 'EXPLORE_REQUIRES_IMAGE';
export type SetCountryImageResult = CountryDetails | 'NOT_FOUND' | CountryImageValidationError;
export type RemoveCountryImageResult = CountryDetails | 'NOT_FOUND';

const toCountryDetails = (country: CountryRecord): CountryDetails => ({
  id: country.id,
  name: country.name,
  code: country.code,
  phoneCode: country.phoneCode,
  currency: country.currency,
  active: country.active,
  availableForPartners: country.availableForPartners,
  visibleInExplore: country.visibleInExplore,
  featured: country.featured,
  displayOrder: country.displayOrder,
  region: country.region as CountryRegion | null,
  imagePath: country.imagePath,
  imageAltText: country.imageAltText,
  imageUrl: getCountryImageUrl(country.imagePath),
  createdAt: country.createdAt.toISOString(),
  updatedAt: country.updatedAt.toISOString(),
});

const buildOrderBy = (
  sortBy: NonNullable<CountryListQuery['sortBy']>,
  sortOrder: NonNullable<CountryListQuery['sortOrder']>
): Prisma.CountryOrderByWithRelationInput => ({ [sortBy]: sortOrder });

/** Case-insensitive exact-name lookup — Country.name has no DB-level unique constraint. */
const findCountryByName = (name: string, excludeId?: string) =>
  prisma.country.findFirst({
    where: {
      name: { equals: name, mode: Prisma.QueryMode.insensitive },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

export async function listCountries(query: CountryListQuery): Promise<CountryListResponse> {
  const page = query.page ?? DEFAULT_PAGE;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortBy = query.sortBy ?? 'name';
  const sortOrder = query.sortOrder ?? 'asc';

  const where: Prisma.CountryWhereInput = {
    ...(query.status === 'ACTIVE' ? { active: true } : {}),
    ...(query.status === 'INACTIVE' ? { active: false } : {}),
    ...(query.availableForPartners === 'AVAILABLE' ? { availableForPartners: true } : {}),
    ...(query.availableForPartners === 'UNAVAILABLE' ? { availableForPartners: false } : {}),
    ...(query.visibleInExplore === 'VISIBLE' ? { visibleInExplore: true } : {}),
    ...(query.visibleInExplore === 'HIDDEN' ? { visibleInExplore: false } : {}),
    ...(query.featured === 'FEATURED' ? { featured: true } : {}),
    ...(query.featured === 'NOT_FEATURED' ? { featured: false } : {}),
    ...(query.region ? { region: query.region } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { code: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const [total, countries] = await Promise.all([
    prisma.country.count({ where }),
    prisma.country.findMany({
      where,
      select: countrySelect,
      orderBy: buildOrderBy(sortBy, sortOrder),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    countries: countries.map(toCountryDetails),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getCountryById(id: string): Promise<CountryDetails | null> {
  const country = await prisma.country.findUnique({ where: { id }, select: countrySelect });
  return country ? toCountryDetails(country) : null;
}

export async function createCountry(input: CreateCountryInput): Promise<CreateCountryResult> {
  const name = input.name.trim();

  if (await findCountryByName(name)) {
    return 'DUPLICATE_NAME';
  }

  const country = await prisma.country.create({
    data: {
      name,
      code: input.code,
      phoneCode: input.phoneCode ?? null,
      currency: input.currency ?? null,
      active: input.active ?? true,
    },
    select: countrySelect,
  });

  return toCountryDetails(country);
}

export async function updateCountry(
  id: string,
  input: UpdateCountryInput
): Promise<UpdateCountryResult> {
  const existing = await prisma.country.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return 'NOT_FOUND';
  }

  if (input.name !== undefined && (await findCountryByName(input.name.trim(), id))) {
    return 'DUPLICATE_NAME';
  }

  const country = await prisma.country.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.phoneCode !== undefined ? { phoneCode: input.phoneCode } : {}),
      ...(input.currency !== undefined ? { currency: input.currency } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
    select: countrySelect,
  });

  return toCountryDetails(country);
}

/**
 * Master-data status only. Independent of `availableForPartners`/`visibleInExplore` — see
 * `updateCountryAvailability` for those. Deactivating a country never touches its
 * historical User/Partner/City relationships.
 */
export async function updateCountryStatus(
  id: string,
  active: boolean
): Promise<UpdateCountryStatusResult> {
  const existing = await prisma.country.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return 'NOT_FOUND';
  }

  const country = await prisma.country.update({
    where: { id },
    data: { active },
    select: countrySelect,
  });

  return toCountryDetails(country);
}

/**
 * Apex Card availability (Partners/Explore/featured/order/region). Enforces the Explore
 * visibility invariant — a country can only be marked `visibleInExplore` while `active`
 * and carrying a destination image — server-side, independent of any client-side warning.
 */
export async function updateCountryAvailability(
  id: string,
  input: UpdateCountryAvailabilityInput
): Promise<UpdateCountryAvailabilityResult> {
  const existing = await prisma.country.findUnique({
    where: { id },
    select: { active: true, imagePath: true, visibleInExplore: true },
  });

  if (!existing) {
    return 'NOT_FOUND';
  }

  const nextVisibleInExplore = input.visibleInExplore ?? existing.visibleInExplore;

  if (nextVisibleInExplore) {
    if (!existing.active) {
      return 'EXPLORE_REQUIRES_ACTIVE';
    }

    if (!existing.imagePath) {
      return 'EXPLORE_REQUIRES_IMAGE';
    }
  }

  const country = await prisma.country.update({
    where: { id },
    data: {
      ...(input.availableForPartners !== undefined
        ? { availableForPartners: input.availableForPartners }
        : {}),
      ...(input.visibleInExplore !== undefined ? { visibleInExplore: input.visibleInExplore } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.displayOrder !== undefined ? { displayOrder: input.displayOrder } : {}),
      ...(input.region !== undefined ? { region: input.region } : {}),
    },
    select: countrySelect,
  });

  return toCountryDetails(country);
}

/** Uploads (or replaces) a country's destination image, cleaning up the previous object. */
export async function setCountryImage(
  id: string,
  file: { buffer: Buffer; mimetype: string; size: number },
  altText?: string
): Promise<SetCountryImageResult> {
  const existing = await prisma.country.findUnique({ where: { id }, select: { imagePath: true } });

  if (!existing) {
    return 'NOT_FOUND';
  }

  const validationError = validateCountryImageFile(file);

  if (validationError) {
    return validationError;
  }

  const newObjectPath = await uploadCountryImage(id, file);

  const country = await prisma.country.update({
    where: { id },
    data: {
      imagePath: newObjectPath,
      ...(altText !== undefined ? { imageAltText: altText } : {}),
    },
    select: countrySelect,
  });

  if (existing.imagePath) {
    void deleteCountryImage(existing.imagePath);
  }

  return toCountryDetails(country);
}

/**
 * Removes a country's destination image. Since Explore visibility requires an image, a
 * currently-visible country is automatically hidden rather than left in an inconsistent
 * "visible but imageless" state.
 */
export async function removeCountryImage(id: string): Promise<RemoveCountryImageResult> {
  const existing = await prisma.country.findUnique({
    where: { id },
    select: { imagePath: true, visibleInExplore: true },
  });

  if (!existing) {
    return 'NOT_FOUND';
  }

  const country = await prisma.country.update({
    where: { id },
    data: {
      imagePath: null,
      imageAltText: null,
      ...(existing.visibleInExplore ? { visibleInExplore: false } : {}),
    },
    select: countrySelect,
  });

  if (existing.imagePath) {
    void deleteCountryImage(existing.imagePath);
  }

  return toCountryDetails(country);
}

/** Lightweight full list for simple selectors (member nationality/residence, City's country picker). */
export async function listCountryOptions(): Promise<CountriesResponse> {
  const countries = await prisma.country.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true, phoneCode: true },
  });

  return { countries };
}

/** Future Partner country selector — active countries available for new Partner assignments. */
export async function listPartnerEnabledCountries(): Promise<CountriesResponse> {
  const countries = await prisma.country.findMany({
    where: { active: true, availableForPartners: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true, phoneCode: true },
  });

  return { countries };
}
