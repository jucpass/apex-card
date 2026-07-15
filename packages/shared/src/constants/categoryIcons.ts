/**
 * Stable, framework-neutral icon identifiers for Category.icon. Each value maps to a
 * Lucide icon in Admin Web (see apps/admin-web/src/lib/categoryIcons.tsx) and, later,
 * in the mobile app — never store JSX/HTML, only this kebab-case key.
 */
export const categoryIconValues = [
  'utensils',
  'coffee',
  'shopping-bag',
  'shirt',
  'dumbbell',
  'heart-pulse',
  'sparkles',
  'car',
  'plane',
  'hotel',
  'film',
  'music',
  'book-open',
  'graduation-cap',
  'briefcase',
  'wrench',
  'scissors',
  'gamepad-2',
  'camera',
  'gift',
  'map-pin',
  'ticket',
  'stethoscope',
  'baby',
] as const;

export type CategoryIconValue = (typeof categoryIconValues)[number];

export const isCategoryIconValue = (value: string): value is CategoryIconValue =>
  (categoryIconValues as readonly string[]).includes(value);
