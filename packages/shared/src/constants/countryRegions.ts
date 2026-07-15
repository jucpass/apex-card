/**
 * Curated display-region groupings for the mobile Explore screen (e.g. grouping
 * featured destinations by continent). Optional on Country — not every country
 * needs one, and it has no bearing on `active`/`availableForPartners`.
 */
export const countryRegions = [
  'europe',
  'africa',
  'americas',
  'asia',
  'oceania',
  'middle-east',
] as const;

export type CountryRegion = (typeof countryRegions)[number];
