import type { CountryRegion } from '../constants/countryRegions';

import type { PaginationMeta, SortOrder } from './common';

/**
 * Full admin management shape. Distinct from `CountryOption` (the lightweight shape used
 * by simple selectors like member nationality/residence) — see docs/database-schema.md's
 * "Global countries vs. Apex Card supported countries" note for why these stay separate.
 */
export type CountryListItem = {
  id: string;
  name: string;
  code: string;
  phoneCode: string | null;
  currency: string | null;
  active: boolean;
  availableForPartners: boolean;
  visibleInExplore: boolean;
  featured: boolean;
  displayOrder: number;
  region: CountryRegion | null;
  imagePath: string | null;
  imageAltText: string | null;
  /** Derived public URL for `imagePath` — never stored, computed at read time. */
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CountryDetails = CountryListItem;

export type CountrySortField = 'name' | 'code' | 'displayOrder' | 'createdAt';

/** Filters on the stored `active` boolean (global/master-data status). */
export type CountryStatusFilter = 'ACTIVE' | 'INACTIVE';
/** Filters on `availableForPartners`. */
export type CountryAvailabilityFilter = 'AVAILABLE' | 'UNAVAILABLE';
/** Filters on `visibleInExplore`. */
export type CountryExploreFilter = 'VISIBLE' | 'HIDDEN';
/** Filters on `featured`. */
export type CountryFeaturedFilter = 'FEATURED' | 'NOT_FEATURED';

export type CountryListQuery = {
  search?: string;
  status?: CountryStatusFilter;
  availableForPartners?: CountryAvailabilityFilter;
  visibleInExplore?: CountryExploreFilter;
  featured?: CountryFeaturedFilter;
  region?: CountryRegion;
  sortBy?: CountrySortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
};

export type CountryListResponse = {
  countries: CountryListItem[];
  pagination: PaginationMeta;
};

export type CountryDetailsResponse = {
  country: CountryDetails;
};

export type CreateCountryInput = {
  name: string;
  code: string;
  phoneCode?: string | null;
  currency?: string | null;
  /** Defaults to `true` when omitted — master-data status, independent of Apex Card availability. */
  active?: boolean;
};

export type UpdateCountryInput = Partial<CreateCountryInput>;

export type UpdateCountryStatusInput = {
  active: boolean;
};

/**
 * Apex Card availability — deliberately separate from `UpdateCountryStatusInput` and from
 * `UpdateCountryInput` so identity edits (name/code/currency) never accidentally touch
 * Partner/Explore availability, and vice versa.
 */
export type UpdateCountryAvailabilityInput = {
  availableForPartners?: boolean;
  visibleInExplore?: boolean;
  featured?: boolean;
  displayOrder?: number;
  region?: CountryRegion | null;
};

export type CountryImageResponse = {
  country: CountryDetails;
};

/**
 * The lightweight `{id, name, code}` shape for simple full-list selectors (member
 * nationality/residence, City's country picker) is `CountryDto`/`CountriesResponse` from
 * `contracts/adminSetup.ts` — reused as-is rather than duplicated here, since it's already
 * the exact shape those existing consumers need.
 */

/** Future mobile Explore consumer — active countries marked visible in Explore. */
export type ExploreCountry = {
  id: string;
  name: string;
  code: string;
  region: CountryRegion | null;
  featured: boolean;
  displayOrder: number;
  imageUrl: string;
  imageAltText: string | null;
};

export type ExploreCountriesResponse = {
  countries: ExploreCountry[];
};
