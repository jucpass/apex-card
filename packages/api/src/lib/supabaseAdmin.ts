import { randomUUID } from 'node:crypto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase Storage client, built from `SUPABASE_SERVICE_ROLE_KEY`. This module
 * must never be imported from apps/admin-web — the service-role key bypasses Storage
 * policies entirely and is only ever read from server-side environment variables here.
 *
 * All image buckets share the same conventions: public bucket, 5MB limit, JPEG/PNG/WebP
 * only, randomised object filenames, and the stable object path (never the public URL)
 * stored in Postgres.
 */

export const COUNTRY_MEDIA_BUCKET = 'country-media';
export const PARTNER_ASSETS_BUCKET = 'partner-assets';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
/** @deprecated kept for the Countries module's original import name. */
export const MAX_COUNTRY_IMAGE_BYTES = MAX_IMAGE_BYTES;

const ALLOWED_IMAGE_MIME_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

let cachedClient: SupabaseClient | null | undefined;
const ensuredBuckets = new Set<string>();

function getClient(): SupabaseClient | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  cachedClient =
    url && serviceRoleKey
      ? createClient(url, serviceRoleKey, { auth: { persistSession: false } })
      : null;

  return cachedClient;
}

export function isStorageConfigured(): boolean {
  return getClient() !== null;
}

async function ensureBucket(supabase: SupabaseClient, bucket: string): Promise<void> {
  if (ensuredBuckets.has(bucket)) {
    return;
  }

  const { data: existing } = await supabase.storage.getBucket(bucket);

  if (existing) {
    ensuredBuckets.add(bucket);
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: true,
    fileSizeLimit: MAX_IMAGE_BYTES,
    allowedMimeTypes: Object.keys(ALLOWED_IMAGE_MIME_TYPES),
  });

  if (createError && !/already exists/i.test(createError.message)) {
    throw new Error(`Could not provision the "${bucket}" Storage bucket: ${createError.message}`);
  }

  ensuredBuckets.add(bucket);
}

export type ImageValidationError = 'INVALID_TYPE' | 'TOO_LARGE';
/** @deprecated kept for the Countries module's original import name. */
export type CountryImageValidationError = ImageValidationError;

/** Validates MIME type (never the filename extension) and size. */
export function validateImageFile(file: {
  mimetype: string;
  size: number;
}): ImageValidationError | null {
  if (!ALLOWED_IMAGE_MIME_TYPES[file.mimetype]) {
    return 'INVALID_TYPE';
  }

  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    return file.size === 0 ? 'INVALID_TYPE' : 'TOO_LARGE';
  }

  return null;
}

/** Uploads with a safe, randomised filename — never derived from the caller-supplied name. */
export async function uploadImage(
  bucket: string,
  pathPrefix: string,
  file: { buffer: Buffer; mimetype: string }
): Promise<string> {
  const supabase = getClient();

  if (!supabase) {
    throw new Error('Supabase Storage is not configured on the server.');
  }

  await ensureBucket(supabase, bucket);

  const extension = ALLOWED_IMAGE_MIME_TYPES[file.mimetype] ?? 'bin';
  const objectPath = `${pathPrefix}/${randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(bucket).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    upsert: false,
  });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  return objectPath;
}

/** Best-effort cleanup — a failed delete (e.g. object already gone) never fails the caller's request. */
export async function deleteObject(bucket: string, objectPath: string): Promise<void> {
  const supabase = getClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.storage.from(bucket).remove([objectPath]);

  if (error) {
    // eslint-disable-next-line no-console
    console.warn(`Could not delete Storage object "${objectPath}": ${error.message}`);
  }
}

export function getPublicUrl(bucket: string, objectPath: string | null): string | null {
  if (!objectPath) {
    return null;
  }

  const supabase = getClient();

  if (!supabase) {
    return null;
  }

  return supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
}

// --- Countries module wrappers (original API, unchanged call sites) ---

export const validateCountryImageFile = validateImageFile;

export const uploadCountryImage = (countryId: string, file: { buffer: Buffer; mimetype: string }) =>
  uploadImage(COUNTRY_MEDIA_BUCKET, `countries/${countryId}`, file);

export const deleteCountryImage = (objectPath: string) =>
  deleteObject(COUNTRY_MEDIA_BUCKET, objectPath);

export const getCountryImageUrl = (objectPath: string | null) =>
  getPublicUrl(COUNTRY_MEDIA_BUCKET, objectPath);
