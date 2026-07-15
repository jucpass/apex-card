import type { CountryRegion } from '@apex-card/shared';

/**
 * Locally re-declared to match `countryRegions` in @apex-card/shared — importing the
 * shared runtime array fails in admin-web's production build (CJS/ESM barrel interop;
 * see categoryIconOptions in categoryIcons.tsx for the same limitation). Keep in sync with
 * packages/shared/src/constants/countryRegions.ts.
 */
export const countryRegionOptions: CountryRegion[] = [
  'europe',
  'africa',
  'americas',
  'asia',
  'oceania',
  'middle-east',
];

export const countryRegionLabelKey: Record<CountryRegion, string> = {
  europe: 'countries.regions.europe',
  africa: 'countries.regions.africa',
  americas: 'countries.regions.americas',
  asia: 'countries.regions.asia',
  oceania: 'countries.regions.oceania',
  'middle-east': 'countries.regions.middleEast',
};
