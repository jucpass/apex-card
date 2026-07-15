import { z } from 'zod';

import { countryRegions } from '../constants/countryRegions';
import type {
  CountryListQuery,
  CreateCountryInput,
  UpdateCountryAvailabilityInput,
  UpdateCountryInput,
  UpdateCountryStatusInput,
} from '../contracts/countries';

type ValidationResult<T> = { success: true; data: T } | { success: false; message: string };

const countrySortFields = ['name', 'code', 'displayOrder', 'createdAt'] as const;
const countryStatusFilters = ['ACTIVE', 'INACTIVE'] as const;
const countryAvailabilityFilters = ['AVAILABLE', 'UNAVAILABLE'] as const;
const countryExploreFilters = ['VISIBLE', 'HIDDEN'] as const;
const countryFeaturedFilters = ['FEATURED', 'NOT_FEATURED'] as const;

const countryNameSchema = z
  .string()
  .trim()
  .min(2, 'Country name must be at least 2 characters.')
  .max(100, 'Country name must be at most 100 characters.');

/** ISO 3166-1 alpha-2/alpha-3 — normalised to uppercase before validation. */
const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2,3}$/, 'Country code must be 2 or 3 letters.');

/** International calling code, e.g. "+1", "+351". */
const phoneCodeSchema = z
  .string()
  .trim()
  .regex(/^\+[0-9]{1,4}$/, 'Phone code must look like "+351".')
  .nullable();

/** ISO 4217 currency code, e.g. "EUR", "USD". */
const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter code, e.g. EUR.')
  .nullable();

const countryListQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  status: z.enum(countryStatusFilters).optional(),
  availableForPartners: z.enum(countryAvailabilityFilters).optional(),
  visibleInExplore: z.enum(countryExploreFilters).optional(),
  featured: z.enum(countryFeaturedFilters).optional(),
  region: z.enum(countryRegions).optional(),
  sortBy: z.enum(countrySortFields).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const parseCountryListQuery = (query: unknown): ValidationResult<CountryListQuery> => {
  const result = countryListQuerySchema.safeParse(query);

  if (!result.success) {
    return { success: false, message: 'Invalid search or filter parameters.' };
  }

  return { success: true, data: result.data };
};

const createCountrySchema = z.object({
  name: countryNameSchema,
  code: countryCodeSchema,
  phoneCode: phoneCodeSchema.optional(),
  currency: currencySchema.optional(),
  active: z.boolean().optional(),
});

export const parseCreateCountryInput = (body: unknown): ValidationResult<CreateCountryInput> => {
  const result = createCountrySchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? 'Invalid country details.',
    };
  }

  return { success: true, data: result.data };
};

const updateCountrySchema = z
  .object({
    name: countryNameSchema.optional(),
    code: countryCodeSchema.optional(),
    phoneCode: phoneCodeSchema.optional(),
    currency: currencySchema.optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export const parseUpdateCountryInput = (body: unknown): ValidationResult<UpdateCountryInput> => {
  const result = updateCountrySchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? 'Invalid country details.',
    };
  }

  return { success: true, data: result.data };
};

const updateCountryStatusSchema = z.object({
  active: z.boolean(),
});

export const parseUpdateCountryStatusInput = (
  body: unknown
): ValidationResult<UpdateCountryStatusInput> => {
  const result = updateCountryStatusSchema.safeParse(body);

  if (!result.success) {
    return { success: false, message: 'A valid active flag is required.' };
  }

  return { success: true, data: result.data };
};

const updateCountryAvailabilitySchema = z
  .object({
    availableForPartners: z.boolean().optional(),
    visibleInExplore: z.boolean().optional(),
    featured: z.boolean().optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    region: z.enum(countryRegions).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export const parseUpdateCountryAvailabilityInput = (
  body: unknown
): ValidationResult<UpdateCountryAvailabilityInput> => {
  const result = updateCountryAvailabilitySchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? 'Invalid availability settings.',
    };
  }

  return { success: true, data: result.data };
};
