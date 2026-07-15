import type { CategoryIconValue } from '../constants/categoryIcons';

import type { PaginationMeta, SortOrder } from './common';

export type CategoryListItem = {
  id: string;
  name: string;
  slug: string;
  icon: CategoryIconValue | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CategoryDetails = CategoryListItem;

export type CategorySortField = 'name' | 'createdAt';

/** Filters on the stored `active` boolean — there is no third "status" concept to conflate with it. */
export type CategoryStatusFilter = 'ACTIVE' | 'INACTIVE';

export type CategoryListQuery = {
  search?: string;
  status?: CategoryStatusFilter;
  sortBy?: CategorySortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
};

export type CategoryListResponse = {
  categories: CategoryListItem[];
  pagination: PaginationMeta;
};

export type CategoryDetailsResponse = {
  category: CategoryDetails;
};

export type CreateCategoryInput = {
  name: string;
  /** Optional — auto-generated (slugified) from `name` when omitted. */
  slug?: string;
  icon?: CategoryIconValue | null;
  /** Defaults to `true` (active) when omitted. */
  active?: boolean;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export type UpdateCategoryStatusInput = {
  active: boolean;
};
