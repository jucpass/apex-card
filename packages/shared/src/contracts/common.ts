export type ApiErrorResponse = {
  status: 'error';
  message: string;
};

export type HealthCheckResponse = {
  status: 'ok' | 'error';
  database: 'connected' | 'disconnected';
};

export type MetaResponse = {
  countries: number;
  cities: number;
  categories: number;
  partners: number;
  users: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type SortOrder = 'asc' | 'desc';
