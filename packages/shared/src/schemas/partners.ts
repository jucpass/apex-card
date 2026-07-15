import { z } from 'zod';

import type {
  CreatePartnerInput,
  PartnerListQuery,
  UpdatePartnerCategoriesInput,
  UpdatePartnerInput,
  UpdatePartnerStatusInput,
} from '../contracts/partners';
import { editablePartnerStatuses, partnerStatuses } from '../contracts/partners';

type ValidationResult<T> = { success: true; data: T } | { success: false; message: string };

const partnerSortFields = ['name', 'createdAt', 'updatedAt', 'status'] as const;

const partnerNameSchema = z
  .string()
  .trim()
  .min(2, 'Business name must be at least 2 characters.')
  .max(150, 'Business name must be at most 150 characters.');

/** Accepts a raw slug candidate; the service layer normalises it with `slugify` before persisting. */
const partnerSlugInputSchema = z
  .string()
  .trim()
  .min(2, 'Slug must be at least 2 characters.')
  .max(150, 'Slug must be at most 150 characters.');

const partnerDescriptionSchema = z.string().trim().max(2000).nullable();

const partnerEmailSchema = z
  .string()
  .trim()
  .email('A valid email address is required.')
  .max(150)
  .nullable();

/** Same convention as the Members module's phone validation. Applies to phone and WhatsApp. */
const partnerPhoneLikeSchema = z.string().trim().min(3).max(30).nullable();

const partnerWebsiteSchema = z
  .string()
  .trim()
  .url('A valid website URL is required (include https://).')
  .max(300)
  .nullable();

const partnerAddressLineSchema = z.string().trim().max(200).nullable();

/** Accepts the common Google Maps URL shapes, including mobile "Share" short links. */
const GOOGLE_MAPS_URL_PATTERN =
  /^https:\/\/((www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]*|maps\.app\.goo\.gl|goo\.gl\/maps)/i;

const partnerGoogleMapsUrlSchema = z
  .string()
  .trim()
  .url('A valid Google Maps URL is required.')
  .max(500)
  .refine((value) => GOOGLE_MAPS_URL_PATTERN.test(value), {
    message: 'The link must be a Google Maps URL (e.g. https://maps.google.com/...).',
  })
  .nullable();
const partnerPostalCodeSchema = z.string().trim().max(20).nullable();

const partnerLatitudeSchema = z.number().min(-90).max(90).nullable();
const partnerLongitudeSchema = z.number().min(-180).max(180).nullable();

const partnerListQuerySchema = z.object({
  search: z.string().trim().min(1).max(150).optional(),
  status: z.enum(partnerStatuses).optional(),
  countryId: z.string().trim().min(1).optional(),
  cityId: z.string().trim().min(1).optional(),
  sortBy: z.enum(partnerSortFields).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const parsePartnerListQuery = (query: unknown): ValidationResult<PartnerListQuery> => {
  const result = partnerListQuerySchema.safeParse(query);

  if (!result.success) {
    return { success: false, message: 'Invalid search or filter parameters.' };
  }

  return { success: true, data: result.data };
};

const partnerFieldSchemas = {
  name: partnerNameSchema,
  slug: partnerSlugInputSchema,
  description: partnerDescriptionSchema,
  email: partnerEmailSchema,
  phone: partnerPhoneLikeSchema,
  whatsapp: partnerPhoneLikeSchema,
  website: partnerWebsiteSchema,
  addressLine1: partnerAddressLineSchema,
  addressLine2: partnerAddressLineSchema,
  postalCode: partnerPostalCodeSchema,
  googleMapsUrl: partnerGoogleMapsUrlSchema,
  latitude: partnerLatitudeSchema,
  longitude: partnerLongitudeSchema,
  countryId: z.string().trim().min(1, 'A country is required.'),
  cityId: z.string().trim().min(1).nullable(),
};

const createPartnerSchema = z.object({
  name: partnerFieldSchemas.name,
  slug: partnerFieldSchemas.slug.optional(),
  description: partnerFieldSchemas.description.optional(),
  email: partnerFieldSchemas.email.optional(),
  phone: partnerFieldSchemas.phone.optional(),
  whatsapp: partnerFieldSchemas.whatsapp.optional(),
  website: partnerFieldSchemas.website.optional(),
  addressLine1: partnerFieldSchemas.addressLine1.optional(),
  addressLine2: partnerFieldSchemas.addressLine2.optional(),
  postalCode: partnerFieldSchemas.postalCode.optional(),
  googleMapsUrl: partnerFieldSchemas.googleMapsUrl.optional(),
  latitude: partnerFieldSchemas.latitude.optional(),
  longitude: partnerFieldSchemas.longitude.optional(),
  countryId: partnerFieldSchemas.countryId,
  cityId: partnerFieldSchemas.cityId.optional(),
});

export const parseCreatePartnerInput = (body: unknown): ValidationResult<CreatePartnerInput> => {
  const result = createPartnerSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? 'Invalid partner details.',
    };
  }

  return { success: true, data: result.data };
};

const updatePartnerSchema = z
  .object({
    name: partnerFieldSchemas.name.optional(),
    slug: partnerFieldSchemas.slug.optional(),
    description: partnerFieldSchemas.description.optional(),
    email: partnerFieldSchemas.email.optional(),
    phone: partnerFieldSchemas.phone.optional(),
    whatsapp: partnerFieldSchemas.whatsapp.optional(),
    website: partnerFieldSchemas.website.optional(),
    addressLine1: partnerFieldSchemas.addressLine1.optional(),
    addressLine2: partnerFieldSchemas.addressLine2.optional(),
    postalCode: partnerFieldSchemas.postalCode.optional(),
    googleMapsUrl: partnerFieldSchemas.googleMapsUrl.optional(),
    latitude: partnerFieldSchemas.latitude.optional(),
    longitude: partnerFieldSchemas.longitude.optional(),
    countryId: partnerFieldSchemas.countryId.optional(),
    cityId: partnerFieldSchemas.cityId.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export const parseUpdatePartnerInput = (body: unknown): ValidationResult<UpdatePartnerInput> => {
  const result = updatePartnerSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      message: result.error.issues[0]?.message ?? 'Invalid partner details.',
    };
  }

  return { success: true, data: result.data };
};

const updatePartnerStatusSchema = z.object({
  status: z.enum(editablePartnerStatuses),
});

export const parseUpdatePartnerStatusInput = (
  body: unknown
): ValidationResult<UpdatePartnerStatusInput> => {
  const result = updatePartnerStatusSchema.safeParse(body);

  if (!result.success) {
    return { success: false, message: 'A valid partner status is required.' };
  }

  return { success: true, data: result.data };
};

const updatePartnerCategoriesSchema = z.object({
  categoryIds: z.array(z.string().trim().min(1)).max(50),
});

export const parseUpdatePartnerCategoriesInput = (
  body: unknown
): ValidationResult<UpdatePartnerCategoriesInput> => {
  const result = updatePartnerCategoriesSchema.safeParse(body);

  if (!result.success) {
    return { success: false, message: 'A valid list of category ids is required.' };
  }

  // Duplicate ids in the payload collapse to one assignment.
  return { success: true, data: { categoryIds: [...new Set(result.data.categoryIds)] } };
};
