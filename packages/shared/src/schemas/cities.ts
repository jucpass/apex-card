import { z } from 'zod';

import type {
  CityListQuery,
  CreateCityInput,
  UpdateCityInput,
  UpdateCityStatusInput,
} from '../contracts/cities';

type ValidationResult<T> = { success: true; data: T } | { success: false; message: string };

const citySortFields = ['name', 'createdAt'] as const;
const cityStatusFilters = ['ACTIVE', 'INACTIVE'] as const;

const cityNameSchema = z
  .string()
  .trim()
  .min(2, 'City name must be at least 2 characters.')
  .max(100, 'City name must be at most 100 characters.');

/** Accepts a raw slug candidate; the service layer normalises it with `slugify` before persisting. */
const citySlugInputSchema = z
  .string()
  .trim()
  .min(2, 'Slug must be at least 2 characters.')
  .max(100, 'Slug must be at most 100 characters.');

const cityListQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  countryId: z.string().trim().min(1).optional(),
  status: z.enum(cityStatusFilters).optional(),
  sortBy: z.enum(citySortFields).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const parseCityListQuery = (query: unknown): ValidationResult<CityListQuery> => {
  const result = cityListQuerySchema.safeParse(query);

  if (!result.success) {
    return { success: false, message: 'Invalid search or filter parameters.' };
  }

  return { success: true, data: result.data };
};

const createCitySchema = z.object({
  countryId: z.string().trim().min(1, 'A country is required.'),
  name: cityNameSchema,
  slug: citySlugInputSchema.optional(),
  active: z.boolean().optional(),
});

export const parseCreateCityInput = (body: unknown): ValidationResult<CreateCityInput> => {
  const result = createCitySchema.safeParse(body);

  if (!result.success) {
    return { success: false, message: result.error.issues[0]?.message ?? 'Invalid city details.' };
  }

  return { success: true, data: result.data };
};

const updateCitySchema = z
  .object({
    countryId: z.string().trim().min(1).optional(),
    name: cityNameSchema.optional(),
    slug: citySlugInputSchema.optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export const parseUpdateCityInput = (body: unknown): ValidationResult<UpdateCityInput> => {
  const result = updateCitySchema.safeParse(body);

  if (!result.success) {
    return { success: false, message: result.error.issues[0]?.message ?? 'Invalid city details.' };
  }

  return { success: true, data: result.data };
};

const updateCityStatusSchema = z.object({
  active: z.boolean(),
});

export const parseUpdateCityStatusInput = (
  body: unknown
): ValidationResult<UpdateCityStatusInput> => {
  const result = updateCityStatusSchema.safeParse(body);

  if (!result.success) {
    return { success: false, message: 'A valid active flag is required.' };
  }

  return { success: true, data: result.data };
};
