import { z } from 'zod';

import { categoryIconValues } from '../constants/categoryIcons';
import type {
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
  UpdateCategoryStatusInput,
} from '../contracts/categories';

type ValidationResult<T> = { success: true; data: T } | { success: false; message: string };

const categorySortFields = ['name', 'createdAt'] as const;
const categoryStatusFilters = ['ACTIVE', 'INACTIVE'] as const;

const categoryNameSchema = z
  .string()
  .trim()
  .min(2, 'Category name must be at least 2 characters.')
  .max(60, 'Category name must be at most 60 characters.');

/** Accepts a raw slug candidate; the service layer normalises it with `slugify` before persisting. */
const categorySlugInputSchema = z
  .string()
  .trim()
  .min(2, 'Slug must be at least 2 characters.')
  .max(80, 'Slug must be at most 80 characters.');

const categoryIconSchema = z.enum(categoryIconValues).nullable();

const categoryListQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  status: z.enum(categoryStatusFilters).optional(),
  sortBy: z.enum(categorySortFields).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const parseCategoryListQuery = (query: unknown): ValidationResult<CategoryListQuery> => {
  const result = categoryListQuerySchema.safeParse(query);

  if (!result.success) {
    return { success: false, message: 'Invalid search or filter parameters.' };
  }

  return { success: true, data: result.data };
};

const createCategorySchema = z.object({
  name: categoryNameSchema,
  slug: categorySlugInputSchema.optional(),
  icon: categoryIconSchema.optional(),
  active: z.boolean().optional(),
});

export const parseCreateCategoryInput = (body: unknown): ValidationResult<CreateCategoryInput> => {
  const result = createCategorySchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? 'Invalid category details.',
    };
  }

  return { success: true, data: result.data };
};

const updateCategorySchema = z
  .object({
    name: categoryNameSchema.optional(),
    slug: categorySlugInputSchema.optional(),
    icon: categoryIconSchema.optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export const parseUpdateCategoryInput = (body: unknown): ValidationResult<UpdateCategoryInput> => {
  const result = updateCategorySchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? 'Invalid category details.',
    };
  }

  return { success: true, data: result.data };
};

const updateCategoryStatusSchema = z.object({
  active: z.boolean(),
});

export const parseUpdateCategoryStatusInput = (
  body: unknown
): ValidationResult<UpdateCategoryStatusInput> => {
  const result = updateCategoryStatusSchema.safeParse(body);

  if (!result.success) {
    return { success: false, message: 'A valid active flag is required.' };
  }

  return { success: true, data: result.data };
};
