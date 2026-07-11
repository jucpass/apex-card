import type { CategoryInput, CityInput, CountryInput } from '../contracts/adminSetup';

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const parseCountryInput = (body: unknown): ValidationResult<CountryInput> => {
  const value = body as Partial<Record<keyof CountryInput, unknown>>;
  const name = asString(value.name);
  const code = asString(value.code).toUpperCase();

  if (!name || !code) {
    return { success: false, message: 'Country name and code are required.' };
  }

  return { success: true, data: { name, code } };
};

export const parseCityInput = (body: unknown): ValidationResult<CityInput> => {
  const value = body as Partial<Record<keyof CityInput, unknown>>;
  const name = asString(value.name);
  const countryId = asString(value.countryId);

  if (!name || !countryId) {
    return { success: false, message: 'City name and country are required.' };
  }

  return { success: true, data: { name, countryId } };
};

export const parseCategoryInput = (body: unknown): ValidationResult<CategoryInput> => {
  const value = body as Partial<Record<keyof CategoryInput, unknown>>;
  const name = asString(value.name);
  const slug = slugify(asString(value.slug) || name);
  const icon = asString(value.icon);

  if (!name || !slug) {
    return { success: false, message: 'Category name and slug are required.' };
  }

  return { success: true, data: { name, slug, icon } };
};
