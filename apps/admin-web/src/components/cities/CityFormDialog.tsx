import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Power, PowerOff } from 'lucide-react';
import type { CityDetails, CountryDto, CreateCityInput, UpdateCityInput } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/common/StatusBadge';
import { countryActiveLabelKey, countryActiveTone } from '@/lib/countryFormatting';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const slugifyCityName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

type CityFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  city: CityDetails | null;
  countries: CountryDto[];
  isLoading?: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (input: CreateCityInput | UpdateCityInput) => void;
  onRequestStatusChange?: (city: CityDetails, nextActive: boolean) => void;
};

function CityFormDialog({
  open,
  onOpenChange,
  mode,
  city,
  countries,
  isLoading = false,
  isSubmitting,
  errorMessage,
  onSubmit,
  onRequestStatusChange,
}: CityFormDialogProps) {
  const { t } = useTranslation();
  const [countryId, setCountryId] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [active, setActive] = useState(true);
  const [countryError, setCountryError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && city) {
      setCountryId(city.countryId);
      setName(city.name);
      setSlug(city.slug);
      setActive(city.active);
    } else if (mode === 'create') {
      setCountryId(countries[0]?.id ?? '');
      setName('');
      setSlug('');
      setActive(true);
    }

    setSlugTouched(false);
    setCountryError(null);
    setNameError(null);
    setSlugError(null);
  }, [open, mode, city, countries]);

  const handleNameChange = (value: string) => {
    setName(value);

    if (mode === 'create' && !slugTouched) {
      setSlug(slugifyCityName(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);

    if (mode === 'create') {
      setSlugTouched(true);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!countryId) {
      setCountryError(t('cities.form.countryRequired'));
      return;
    }

    setCountryError(null);

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (trimmedName.length < 2) {
      setNameError(t('cities.form.nameRequired'));
      return;
    }

    setNameError(null);

    if (!SLUG_PATTERN.test(trimmedSlug)) {
      setSlugError(t('cities.form.slugInvalid'));
      return;
    }

    setSlugError(null);

    if (mode === 'create') {
      onSubmit({ countryId, name: trimmedName, slug: trimmedSlug, active });
      return;
    }

    if (!city) {
      return;
    }

    const input: UpdateCityInput = {};
    if (countryId !== city.countryId) input.countryId = countryId;
    if (trimmedName !== city.name) input.name = trimmedName;
    if (trimmedSlug !== city.slug) input.slug = trimmedSlug;

    if (Object.keys(input).length === 0) {
      onOpenChange(false);
      return;
    }

    onSubmit(input);
  };

  const isReady = mode === 'create' || (!isLoading && city !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('cities.form.createTitle') : t('cities.form.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('cities.form.createDescription')
              : t('cities.form.editDescription')}
          </DialogDescription>
        </DialogHeader>

        {!isReady ? (
          <div className="flex flex-col gap-4 py-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-2">
              <div className="grid gap-1.5">
                <Label htmlFor="city-form-country">{t('cities.form.countryLabel')}</Label>
                <Select value={countryId} onValueChange={(value) => setCountryId(value ?? '')}>
                  <SelectTrigger
                    id="city-form-country"
                    className="w-full"
                    aria-invalid={countryError ? true : undefined}
                  >
                    <SelectValue placeholder={t('cities.form.countryPlaceholder')}>
                      {(value: string) =>
                        countries.find((country) => country.id === value)?.name ?? ''
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {countryError ? <p className="text-xs text-destructive">{countryError}</p> : null}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="city-form-name">{t('cities.form.nameLabel')}</Label>
                <Input
                  id="city-form-name"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  aria-invalid={nameError ? true : undefined}
                  maxLength={100}
                  required
                />
                {nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="city-form-slug">{t('cities.form.slugLabel')}</Label>
                <Input
                  id="city-form-slug"
                  value={slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  aria-invalid={slugError ? true : undefined}
                  maxLength={100}
                  required
                />
                {slugError ? (
                  <p className="text-xs text-destructive">{slugError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t('cities.form.slugHint')}</p>
                )}
              </div>

              {mode === 'create' ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="city-form-active">{t('cities.form.activeLabel')}</Label>
                  <Select
                    value={active ? 'active' : 'inactive'}
                    onValueChange={(value) => setActive(value === 'active')}
                  >
                    <SelectTrigger id="city-form-active" className="w-full">
                      <SelectValue>
                        {(value: 'active' | 'inactive') => t(countryActiveLabelKey[value])}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t(countryActiveLabelKey.active)}</SelectItem>
                      <SelectItem value="inactive">{t(countryActiveLabelKey.inactive)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : city ? (
                <>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <Label>{t('cities.form.statusLabel')}</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        tone={countryActiveTone[city.active ? 'active' : 'inactive']}
                        label={t(countryActiveLabelKey[city.active ? 'active' : 'inactive'])}
                      />
                      {onRequestStatusChange ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => onRequestStatusChange(city, !city.active)}
                        >
                          {city.active ? <PowerOff /> : <Power />}
                          {city.active
                            ? t('cities.actions.deactivate')
                            : t('cities.actions.activate')}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : null}

              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t('cities.form.saving')
                  : mode === 'create'
                    ? t('cities.form.createConfirm')
                    : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CityFormDialog;
