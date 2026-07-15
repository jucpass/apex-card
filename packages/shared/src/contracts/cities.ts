import type { PaginationMeta, SortOrder } from './common';

export type CityListItem = {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  countryId: string;
  countryName: string;
  createdAt: string;
  updatedAt: string;
};

export type CityDetails = CityListItem;

export type CitySortField = 'name' | 'createdAt';

export type CityStatusFilter = 'ACTIVE' | 'INACTIVE';

export type CityListQuery = {
  search?: string;
  countryId?: string;
  status?: CityStatusFilter;
  sortBy?: CitySortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
};

export type CityListResponse = {
  cities: CityListItem[];
  pagination: PaginationMeta;
};

export type CityDetailsResponse = {
  city: CityDetails;
};

export type CreateCityInput = {
  countryId: string;
  name: string;
  /** Optional — auto-generated (slugified) from `name` when omitted. Unique within `countryId`. */
  slug?: string;
  active?: boolean;
};

export type UpdateCityInput = Partial<CreateCityInput>;

export type UpdateCityStatusInput = {
  active: boolean;
};

export type CityOption = {
  id: string;
  name: string;
};

/** Future Partner city selector — active cities scoped to a single country. */
export type ActiveCitiesByCountryResponse = {
  cities: CityOption[];
};
