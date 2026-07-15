import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '@supabase/supabase-js';
import type { CountryDto, CreatePartnerInput, PartnerDetails } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
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
import { apiRequest } from '@/lib/apiClient';
import { slugifyPartnerName } from '@/lib/partnerFormatting';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
// Keep in sync with packages/shared/src/schemas/partners.ts (CJS/ESM barrel interop
// prevents importing the shared runtime pattern).
const GOOGLE_MAPS_URL_PATTERN =
  /^https:\/\/((www\.)?google\.[a-z.]+\/maps|maps\.google\.[a-z.]*|maps\.app\.goo\.gl|goo\.gl\/maps)/i;
const NO_CITY_VALUE = '__none__';

type CityOption = { id: string; name: string };

type PartnerFormProps = {
  mode: 'create' | 'edit';
  initial: PartnerDetails | null;
  countries: CountryDto[];
  session: Session;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (input: CreatePartnerInput) => void;
  onCancel: () => void;
};

function FieldError({ message }: { message: string | null }) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

function PartnerForm({
  mode,
  initial,
  countries,
  session,
  isSubmitting,
  errorMessage,
  onSubmit,
  onCancel,
}: PartnerFormProps) {
  const { t } = useTranslation();

  const [name, setName] = useState(initial?.name ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp ?? '');
  const [website, setWebsite] = useState(initial?.website ?? '');
  const [addressLine1, setAddressLine1] = useState(initial?.addressLine1 ?? '');
  const [addressLine2, setAddressLine2] = useState(initial?.addressLine2 ?? '');
  const [postalCode, setPostalCode] = useState(initial?.postalCode ?? '');
  const [googleMapsUrl, setGoogleMapsUrl] = useState(initial?.googleMapsUrl ?? '');
  const [latitude, setLatitude] = useState(initial?.latitude?.toString() ?? '');
  const [longitude, setLongitude] = useState(initial?.longitude?.toString() ?? '');
  const [countryId, setCountryId] = useState(initial?.countryId ?? '');
  const [cityId, setCityId] = useState(initial?.cityId ?? NO_CITY_VALUE);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!countryId) {
      setCities([]);
      return;
    }

    let cancelled = false;

    void apiRequest<{ cities: CityOption[] }>(`/api/admin/cities/by-country/${countryId}`, session)
      .then((result) => {
        if (!cancelled) {
          setCities(result.cities);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCities([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [countryId, session]);

  const handleNameChange = (value: string) => {
    setName(value);

    if (mode === 'create' && !slugTouched) {
      setSlug(slugifyPartnerName(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);

    if (mode === 'create') {
      setSlugTouched(true);
    }
  };

  const handleCountryChange = (value: string | null) => {
    const next = value ?? '';

    if (next === countryId) {
      return;
    }

    setCountryId(next);
    // A city from another country is never valid — reset so the admin re-picks.
    setCityId(NO_CITY_VALUE);

    // Prefix assistance: prefill the country calling code into empty phone/WhatsApp
    // fields. A value that is exactly the previous country's prefix counts as "empty"
    // (pure prefill, nothing typed), so switching countries swaps it — but any manually
    // entered number is never touched.
    const previousPrefix = countries.find((country) => country.id === countryId)?.phoneCode ?? '';
    const nextPrefix = countries.find((country) => country.id === next)?.phoneCode ?? '';

    const applyPrefix = (current: string) => {
      const trimmed = current.trim();

      if (trimmed === '' || (previousPrefix !== '' && trimmed === previousPrefix)) {
        return nextPrefix;
      }

      return current;
    };

    setPhone(applyPrefix);
    setWhatsapp(applyPrefix);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const nextErrors: Record<string, string | null> = {};
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    const trimmedEmail = email.trim();
    const trimmedWebsite = website.trim();
    const trimmedPhone = phone.trim();
    const trimmedWhatsapp = whatsapp.trim();
    const trimmedLatitude = latitude.trim();
    const trimmedLongitude = longitude.trim();
    const trimmedGoogleMapsUrl = googleMapsUrl.trim();

    if (trimmedName.length < 2) {
      nextErrors.name = t('partners.form.nameRequired');
    }

    if (!SLUG_PATTERN.test(trimmedSlug)) {
      nextErrors.slug = t('partners.form.slugInvalid');
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = t('partners.form.emailInvalid');
    }

    if (trimmedWebsite && !/^https?:\/\/.+/.test(trimmedWebsite)) {
      nextErrors.website = t('partners.form.websiteInvalid');
    }

    if (trimmedPhone && trimmedPhone.length < 3) {
      nextErrors.phone = t('partners.form.phoneInvalid');
    }

    if (trimmedWhatsapp && trimmedWhatsapp.length < 3) {
      nextErrors.whatsapp = t('partners.form.phoneInvalid');
    }

    if (!countryId) {
      nextErrors.countryId = t('partners.form.countryRequired');
    }

    if (trimmedGoogleMapsUrl && !GOOGLE_MAPS_URL_PATTERN.test(trimmedGoogleMapsUrl)) {
      nextErrors.googleMapsUrl = t('partners.form.googleMapsUrlInvalid');
    }

    const parsedLatitude = trimmedLatitude === '' ? null : Number(trimmedLatitude);
    const parsedLongitude = trimmedLongitude === '' ? null : Number(trimmedLongitude);

    if (
      parsedLatitude !== null &&
      (Number.isNaN(parsedLatitude) || Math.abs(parsedLatitude) > 90)
    ) {
      nextErrors.latitude = t('partners.form.latitudeInvalid');
    }

    if (
      parsedLongitude !== null &&
      (Number.isNaN(parsedLongitude) || Math.abs(parsedLongitude) > 180)
    ) {
      nextErrors.longitude = t('partners.form.longitudeInvalid');
    }

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    onSubmit({
      name: trimmedName,
      slug: trimmedSlug,
      description: description.trim() || null,
      email: trimmedEmail || null,
      phone: trimmedPhone || null,
      whatsapp: trimmedWhatsapp || null,
      website: trimmedWebsite || null,
      addressLine1: addressLine1.trim() || null,
      addressLine2: addressLine2.trim() || null,
      postalCode: postalCode.trim() || null,
      googleMapsUrl: trimmedGoogleMapsUrl || null,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      countryId,
      cityId: cityId === NO_CITY_VALUE ? null : cityId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t('partners.form.identitySection')}
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="partner-form-name">{t('partners.form.nameLabel')}</Label>
            <Input
              id="partner-form-name"
              value={name}
              onChange={(event) => handleNameChange(event.target.value)}
              aria-invalid={errors.name ? true : undefined}
              maxLength={150}
              required
            />
            <FieldError message={errors.name ?? null} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="partner-form-slug">{t('partners.form.slugLabel')}</Label>
            <Input
              id="partner-form-slug"
              value={slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              aria-invalid={errors.slug ? true : undefined}
              maxLength={150}
              required
            />
            {errors.slug ? (
              <FieldError message={errors.slug} />
            ) : (
              <p className="text-xs text-muted-foreground">{t('partners.form.slugHint')}</p>
            )}
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="partner-form-description">{t('partners.form.descriptionLabel')}</Label>
            <textarea
              id="partner-form-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={2000}
              rows={3}
              className="rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t('partners.form.contactSection')}
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="partner-form-email">{t('partners.form.emailLabel')}</Label>
            <Input
              id="partner-form-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-invalid={errors.email ? true : undefined}
              maxLength={150}
            />
            <FieldError message={errors.email ?? null} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="partner-form-website">{t('partners.form.websiteLabel')}</Label>
            <Input
              id="partner-form-website"
              type="url"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              aria-invalid={errors.website ? true : undefined}
              placeholder="https://"
              maxLength={300}
            />
            <FieldError message={errors.website ?? null} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="partner-form-phone">{t('partners.form.phoneLabel')}</Label>
            <Input
              id="partner-form-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              aria-invalid={errors.phone ? true : undefined}
              maxLength={30}
            />
            <FieldError message={errors.phone ?? null} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="partner-form-whatsapp">{t('partners.form.whatsappLabel')}</Label>
            <Input
              id="partner-form-whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              aria-invalid={errors.whatsapp ? true : undefined}
              maxLength={30}
            />
            <FieldError message={errors.whatsapp ?? null} />
          </div>
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {t('partners.form.addressSection')}
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="partner-form-address1">{t('partners.form.addressLine1Label')}</Label>
            <Input
              id="partner-form-address1"
              value={addressLine1}
              onChange={(event) => setAddressLine1(event.target.value)}
              maxLength={200}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="partner-form-address2">{t('partners.form.addressLine2Label')}</Label>
            <Input
              id="partner-form-address2"
              value={addressLine2}
              onChange={(event) => setAddressLine2(event.target.value)}
              maxLength={200}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="partner-form-country">{t('partners.form.countryLabel')}</Label>
            <Select value={countryId || null} onValueChange={handleCountryChange}>
              <SelectTrigger
                id="partner-form-country"
                className="w-full"
                aria-invalid={errors.countryId ? true : undefined}
              >
                <SelectValue placeholder={t('partners.form.countryPlaceholder')}>
                  {(value: string | null) =>
                    countries.find((country) => country.id === value)?.name ??
                    t('partners.form.countryPlaceholder')
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
            <FieldError message={errors.countryId ?? null} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="partner-form-city">{t('partners.form.cityLabel')}</Label>
            <Select
              value={cityId}
              onValueChange={(value) => setCityId(value ?? NO_CITY_VALUE)}
              disabled={!countryId}
            >
              <SelectTrigger id="partner-form-city" className="w-full">
                <SelectValue placeholder={t('partners.form.cityPlaceholder')}>
                  {(value: string) =>
                    value === NO_CITY_VALUE
                      ? t('partners.form.cityPlaceholder')
                      : (cities.find((city) => city.id === value)?.name ??
                        (initial?.cityId === value ? (initial?.cityName ?? value) : value))
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CITY_VALUE}>{t('partners.form.cityPlaceholder')}</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="partner-form-postal">{t('partners.form.postalCodeLabel')}</Label>
            <Input
              id="partner-form-postal"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              maxLength={20}
            />
          </div>

          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor="partner-form-maps">{t('partners.form.googleMapsUrlLabel')}</Label>
            <Input
              id="partner-form-maps"
              type="url"
              value={googleMapsUrl}
              onChange={(event) => setGoogleMapsUrl(event.target.value)}
              aria-invalid={errors.googleMapsUrl ? true : undefined}
              placeholder="https://maps.google.com/..."
              maxLength={500}
            />
            {errors.googleMapsUrl ? (
              <FieldError message={errors.googleMapsUrl} />
            ) : (
              <p className="text-xs text-muted-foreground">
                {t('partners.form.googleMapsUrlHint')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="partner-form-latitude">{t('partners.form.latitudeLabel')}</Label>
              <Input
                id="partner-form-latitude"
                inputMode="decimal"
                value={latitude}
                onChange={(event) => setLatitude(event.target.value)}
                aria-invalid={errors.latitude ? true : undefined}
              />
              <FieldError message={errors.latitude ?? null} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="partner-form-longitude">{t('partners.form.longitudeLabel')}</Label>
              <Input
                id="partner-form-longitude"
                inputMode="decimal"
                value={longitude}
                onChange={(event) => setLongitude(event.target.value)}
                aria-invalid={errors.longitude ? true : undefined}
              />
              <FieldError message={errors.longitude ?? null} />
            </div>
          </div>
        </div>
      </section>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t('partners.form.saving')
            : mode === 'create'
              ? t('partners.form.createConfirm')
              : t('common.save')}
        </Button>
      </div>
    </form>
  );
}

export default PartnerForm;
