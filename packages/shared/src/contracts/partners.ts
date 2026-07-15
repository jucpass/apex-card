import type { PaginationMeta, SortOrder } from './common';

/**
 * Mirrors the Prisma `PartnerStatus` enum. The Admin Portal's core Partner module only
 * ever sets `DRAFT` (initial), `ACTIVE`, and `INACTIVE`; `SUSPENDED` exists in the schema
 * for a future moderation flow and is never offered as an admin action here.
 */
export const partnerStatuses = ['DRAFT', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
export type PartnerStatus = (typeof partnerStatuses)[number];

/** The only statuses an admin can move a Partner to — Draft is set once, at creation. */
export const editablePartnerStatuses = ['ACTIVE', 'INACTIVE'] as const;
export type EditablePartnerStatus = (typeof editablePartnerStatuses)[number];

/** Partner image limits — enforced server-side, mirrored in the Admin UI. */
export const PARTNER_MEDIA_MAX_IMAGES = 3;

export type PartnerMediaItem = {
  id: string;
  /** Stable Storage object path in the public `partner-assets` bucket — the source of truth. */
  storagePath: string;
  /** Derived public URL — computed at read time, never stored. */
  imageUrl: string | null;
  mimeType: string;
  isCover: boolean;
  sortOrder: number;
  createdAt: string;
};

export type PartnerListItem = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: PartnerStatus;
  countryId: string;
  countryName: string;
  cityId: string | null;
  cityName: string | null;
  /** Resolved public URL of the cover image, for cards/summaries. */
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartnerCategorySummary = {
  categoryId: string;
  name: string;
  icon: string | null;
};

export type PartnerDetails = PartnerListItem & {
  description: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  /** Preferred navigation link for the mobile app — validated as a Google Maps URL. */
  googleMapsUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Assigned business categories (many-to-many, managed from the Details Workspace). */
  categories: PartnerCategorySummary[];
  /** Ordered by `sortOrder`; contains at most `PARTNER_MEDIA_MAX_IMAGES` items. */
  media: PartnerMediaItem[];
};

export type PartnerSortField = 'name' | 'createdAt' | 'updatedAt' | 'status';

export type PartnerListQuery = {
  /** Matches business name, email, telephone, or WhatsApp. */
  search?: string;
  status?: PartnerStatus;
  countryId?: string;
  cityId?: string;
  sortBy?: PartnerSortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
};

export type PartnerListResponse = {
  partners: PartnerListItem[];
  pagination: PaginationMeta;
};

export type PartnerDetailsResponse = {
  partner: PartnerDetails;
};

export type CreatePartnerInput = {
  name: string;
  /** Optional — auto-generated (slugified) from `name` when omitted. Unique. */
  slug?: string;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  countryId: string;
  cityId?: string | null;
};

export type UpdatePartnerInput = Partial<CreatePartnerInput>;

export type UpdatePartnerStatusInput = {
  status: EditablePartnerStatus;
};

/** Full-set replace — the server diffs against current assignments, so it is idempotent. */
export type UpdatePartnerCategoriesInput = {
  categoryIds: string[];
};
