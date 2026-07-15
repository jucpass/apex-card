import { Prisma, prisma } from '@apex/database';
import {
  slugify,
  type CategoryDetails,
  type CategoryIconValue,
  type CategoryListItem,
  type CategoryListQuery,
  type CategoryListResponse,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@apex-card/shared';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  icon: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CategorySelect;

type CategoryRecord = Prisma.CategoryGetPayload<{ select: typeof categorySelect }>;

export type CreateCategoryResult = CategoryDetails | 'DUPLICATE_NAME';
export type UpdateCategoryResult = CategoryDetails | 'NOT_FOUND' | 'DUPLICATE_NAME';
export type UpdateCategoryStatusResult = CategoryDetails | 'NOT_FOUND';

const toCategoryListItem = (category: CategoryRecord): CategoryListItem => ({
  id: category.id,
  name: category.name,
  slug: category.slug,
  icon: category.icon as CategoryIconValue | null,
  active: category.active,
  createdAt: category.createdAt.toISOString(),
  updatedAt: category.updatedAt.toISOString(),
});

const buildOrderBy = (
  sortBy: NonNullable<CategoryListQuery['sortBy']>,
  sortOrder: NonNullable<CategoryListQuery['sortOrder']>
): Prisma.CategoryOrderByWithRelationInput => ({ [sortBy]: sortOrder });

/** Case-insensitive exact-name lookup — Category.name has no DB-level unique constraint. */
const findCategoryByName = (name: string, excludeId?: string) =>
  prisma.category.findFirst({
    where: {
      name: { equals: name, mode: Prisma.QueryMode.insensitive },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

export async function listCategories(query: CategoryListQuery): Promise<CategoryListResponse> {
  const page = query.page ?? DEFAULT_PAGE;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortBy = query.sortBy ?? 'name';
  const sortOrder = query.sortOrder ?? 'asc';

  const where: Prisma.CategoryWhereInput = {
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

  const [total, categories] = await Promise.all([
    prisma.category.count({ where }),
    prisma.category.findMany({
      where,
      select: categorySelect,
      orderBy: buildOrderBy(sortBy, sortOrder),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    categories: categories.map(toCategoryListItem),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getCategoryById(id: string): Promise<CategoryDetails | null> {
  const category = await prisma.category.findUnique({ where: { id }, select: categorySelect });
  return category ? toCategoryListItem(category) : null;
}

/**
 * Creates a Category. Slug always derives from an explicit `slug` when provided (still
 * normalised via `slugify` for URL-safety), otherwise from `name` — this is the only place
 * a slug is ever auto-generated from the name.
 */
export async function createCategory(input: CreateCategoryInput): Promise<CreateCategoryResult> {
  const name = input.name.trim();

  if (await findCategoryByName(name)) {
    return 'DUPLICATE_NAME';
  }

  const slug = slugify(input.slug?.trim() ? input.slug : name);

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      icon: input.icon ?? null,
      active: input.active ?? true,
    },
    select: categorySelect,
  });

  return toCategoryListItem(category);
}

/**
 * Updates a Category. `slug` only changes when the caller explicitly includes it in the
 * payload — a `name`-only update never touches `slug`, so a manually customised slug is
 * never silently regenerated when the name changes later.
 */
export async function updateCategory(
  id: string,
  input: UpdateCategoryInput
): Promise<UpdateCategoryResult> {
  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return 'NOT_FOUND';
  }

  if (input.name !== undefined && (await findCategoryByName(input.name.trim(), id))) {
    return 'DUPLICATE_NAME';
  }

  const category = await prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.slug !== undefined ? { slug: slugify(input.slug) } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
    select: categorySelect,
  });

  return toCategoryListItem(category);
}

/**
 * Activates/deactivates a Category. This never deletes the row — historical Partner and
 * PromoBanner relationships are preserved; deactivating only excludes it from future
 * assignments and mobile browsing (enforced by the consumers of `active`, not here).
 */
export async function updateCategoryStatus(
  id: string,
  active: boolean
): Promise<UpdateCategoryStatusResult> {
  const existing = await prisma.category.findUnique({ where: { id }, select: { id: true } });

  if (!existing) {
    return 'NOT_FOUND';
  }

  const category = await prisma.category.update({
    where: { id },
    data: { active },
    select: categorySelect,
  });

  return toCategoryListItem(category);
}
