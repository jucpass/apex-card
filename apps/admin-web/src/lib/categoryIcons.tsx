import {
  Baby,
  BookOpen,
  Briefcase,
  Camera,
  Car,
  Coffee,
  Dumbbell,
  Film,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Hotel,
  MapPin,
  Music,
  Plane,
  Scissors,
  Shirt,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  Tag,
  Ticket,
  Utensils,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { CategoryIconValue } from '@apex-card/shared';

/**
 * Locally re-declared to mirror `categoryIconValues` in @apex-card/shared — Vite/Rollup's
 * production build can't statically resolve a real (non-type) named export re-exported
 * through the shared package's CJS index barrel (same limitation documented in
 * MembersFilters.tsx). Keep this list's values in sync with
 * packages/shared/src/constants/categoryIcons.ts.
 */
export const categoryIconOptions: { value: CategoryIconValue; icon: LucideIcon }[] = [
  { value: 'utensils', icon: Utensils },
  { value: 'coffee', icon: Coffee },
  { value: 'shopping-bag', icon: ShoppingBag },
  { value: 'shirt', icon: Shirt },
  { value: 'dumbbell', icon: Dumbbell },
  { value: 'heart-pulse', icon: HeartPulse },
  { value: 'sparkles', icon: Sparkles },
  { value: 'car', icon: Car },
  { value: 'plane', icon: Plane },
  { value: 'hotel', icon: Hotel },
  { value: 'film', icon: Film },
  { value: 'music', icon: Music },
  { value: 'book-open', icon: BookOpen },
  { value: 'graduation-cap', icon: GraduationCap },
  { value: 'briefcase', icon: Briefcase },
  { value: 'wrench', icon: Wrench },
  { value: 'scissors', icon: Scissors },
  { value: 'gamepad-2', icon: Gamepad2 },
  { value: 'camera', icon: Camera },
  { value: 'gift', icon: Gift },
  { value: 'map-pin', icon: MapPin },
  { value: 'ticket', icon: Ticket },
  { value: 'stethoscope', icon: Stethoscope },
  { value: 'baby', icon: Baby },
];

const categoryIconMap: Partial<Record<CategoryIconValue, LucideIcon>> = Object.fromEntries(
  categoryIconOptions.map((option) => [option.value, option.icon])
);

/** Falls back to a generic tag icon when a category has no icon or an unrecognised value. */
export const categoryIconFallback: LucideIcon = Tag;

export function resolveCategoryIcon(icon: string | null | undefined): LucideIcon {
  if (!icon) {
    return categoryIconFallback;
  }

  return categoryIconMap[icon as CategoryIconValue] ?? categoryIconFallback;
}
