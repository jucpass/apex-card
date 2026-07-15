import { Prisma, prisma } from '@apex/database';
import {
  slugify,
  type CityDetails,
  type CityListQuery,
  type CityListResponse,
  type CreateCityInput,
  type UpdateCityInput,
} from '@apex-card/shared';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const citySelect = {
  id: true,
  name: true,
  slug: true,
  active: true,
  countryId: true,
  country: { select: { name: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CitySelect;

type CityRecord = Prisma.CityGetPayload<{ select: typeof citySelect }>;

export type CreateCityResult = CityDetails | 'DUPLICATE_NAME' | 'COUNTRY_NOT_FOUND';
export type UpdateCityResult = CityDetails | 'NOT_FOUND' | 'DUPLICATE_NAME' | 'COUNTRY_NOT_FOUND';
export type UpdateCityStatusResult = CityDetails | 'NOT_FOUND';

const toCityDetails = (city: CityRecord): CityDetails => ({
  id: city.id,
  name: city.name,
  slug: city.slug,
  active: city.active,
  countryId: city.countryId,
  countryName: city.country.name,
  createdAt: city.createdAt.toISOString(),
  updatedAt: city.updatedAt.toISOString(),
});

const buildOrderBy = (
  sortBy: NonNullable<CityListQuery['sortBy']>,
  sortOrder: NonNullable<CityListQuery['sortOrder']>
): Prisma.CityOrderByWithRelationInput => ({ [sortBy]: sortOrder });

/**
 * Case-insensitive name lookup scoped to a single country — City names/slugs may repeat
 * across different countries (e.g. "Santa Cruz"), but must be unique within one.
 */
const findCityByNameInCountry = (countryId: string, name: string, excludeId?: string) =>
  prisma.city.findFirst({
    where: {
      countryId,
      name: { equals: name, mode: Prisma.QueryMode.insensitive },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

export async function listCities(query: CityListQuery): Promise<CityListResponse> {
  const page = query.page ?? DEFAULT_PAGE;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortBy = query.sortBy ?? 'name';
  const sortOrder = query.sortOrder ?? 'asc';

  const where: Prisma.CityWhereInput = {
    ...(query.countryId ? { countryId: query.countryId } : {}),
    ...(query.status === 'ACTIVE' ? { active: true } : {}),
    ...(query.status === 'INACTIVE' ? { active: false } : {}),
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
            { slug: { contains: query.search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const [total, cities] = await Promise.all([
    prisma.city.count({ where }),
    prisma.city.findMany({
      where,
      select: citySelect,
      orderBy: buildOrderBy(sortBy, sortOrder),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    cities: cities.map(toCityDetails),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getCityById(id: string): Promise<CityDetails | null> {
  const city = await prisma.city.findUnique({ where: { id }, select: citySelect });
  return city ? toCityDetails(city) : null;
}

export async function createCity(input: CreateCityInput): Promise<CreateCityResult> {
  const country = await prisma.country.findUnique({
    where: { id: input.countryId },
    select: { id: true },
  });

  if (!country) {
    return 'COUNTRY_NOT_FOUND';
  }

  const name = input.name.trim();

  if (await findCityByNameInCountry(input.countryId, name)) {
    return 'DUPLICATE_NAME';
  }

  const slug = slugify(input.slug?.trim() ? input.slug : name);

  const city = await prisma.city.create({
    data: { countryId: input.countryId, name, slug, active: input.active ?? true },
    select: citySelect,
  });

  return toCityDetails(city);
}

/**
 * `slug` only changes when explicitly included in the payload — a `name`-only update never
 * regenerates it, matching the Categories module's slug-stability guarantee.
 */
export async function updateCity(id: string, input: UpdateCityInput): Promise<UpdateCityResult> {
  const existing = await prisma.city.findUnique({ where: { id }, select: { countryId: true } });

  if (!existing) {
    return 'NOT_FOUND';
  }

  if (input.countryId !== undefined) {
    const country = await prisma.country.findUnique({
      where: { id: input.countryId },
      select: { id: true },
    });

    if (!country) {
      return 'COUNTRY_NOT_FOUND';
    }
  }

  const targetCountryId = input.countryId ?? existing.countryId;

  if (
    input.name !== undefined &&
    (await findCityByNameInCountry(targetCountryId, input.name.trim(), id))
  ) {
    return 'DUPLICATE_NAME';
  }

  const city = await prisma.city.update({
    where: { id },
    data: {
      ...(input.countryId !== undefined ? { countryId: input.countryId } : {}),
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.slug !== undefined ? { slug: slugify(input.slug) } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
    select: citySelect,
  });

  return toCityDetails(city);
}

/** Never deletes — historical Partner/PromoBanner relationships to a City are preserved. */
export async function updateCityStatus(
  id: string,
  active: boolean
): Promise<UpdateCityStatusResult> {
  const existing = await prisma.city.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return 'NOT_FOUND';
  }

  const city = await prisma.city.update({ where: { id }, data: { active }, select: citySelect });

  return toCityDetails(city);
}

export type ActiveCitiesByCountryResult =
  { cities: { id: string; name: string }[] } | 'COUNTRY_NOT_FOUND';

/** Future Partner city selector — active cities scoped to one country. */
export async function listActiveCitiesByCountry(
  countryId: string
): Promise<ActiveCitiesByCountryResult> {
  const country = await prisma.country.findUnique({
    where: { id: countryId },
    select: { id: true },
  });

  if (!country) {
    return 'COUNTRY_NOT_FOUND';
  }

  const cities = await prisma.city.findMany({
    where: { countryId, active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return { cities };
}
