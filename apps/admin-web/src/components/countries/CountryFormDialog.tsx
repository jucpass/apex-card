import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '@supabase/supabase-js';
import { Power, PowerOff } from 'lucide-react';
import type {
  CountryDetails,
  CountryRegion,
  CreateCountryInput,
  UpdateCountryAvailabilityInput,
  UpdateCountryInput,
} from '@apex-card/shared';

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
import { Switch } from '@/components/ui/switch';
import StatusBadge from '@/components/common/StatusBadge';
import CountryImageUploader from '@/components/countries/CountryImageUploader';
import { countryActiveLabelKey, countryActiveTone } from '@/lib/countryFormatting';
import { countryRegionLabelKey, countryRegionOptions } from '@/lib/countryRegions';

export type CountryEditSubmitPayload = {
  identity: UpdateCountryInput | null;
  availability: UpdateCountryAvailabilityInput | null;
};

const NONE_REGION = '__none__';

type CountryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  country: CountryDetails | null;
  session: Session;
  isLoading?: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onCreate: (input: CreateCountryInput) => void;
  onEditSubmit: (payload: CountryEditSubmitPayload) => void;
  onCountryUpdated: (country: CountryDetails) => void;
  onRequestStatusChange: (country: CountryDetails, nextActive: boolean) => void;
};

function CountryFormDialog({
  open,
  onOpenChange,
  mode,
  country,
  session,
  isLoading = false,
  isSubmitting,
  errorMessage,
  onCreate,
  onEditSubmit,
  onCountryUpdated,
  onRequestStatusChange,
}: CountryFormDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [currency, setCurrency] = useState('');
  const [active, setActive] = useState(true);
  const [availableForPartners, setAvailableForPartners] = useState(false);
  const [visibleInExplore, setVisibleInExplore] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [region, setRegion] = useState<CountryRegion | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && country) {
      setName(country.name);
      setCode(country.code);
      setPhoneCode(country.phoneCode ?? '');
      setCurrency(country.currency ?? '');
      setAvailableForPartners(country.availableForPartners);
      setVisibleInExplore(country.visibleInExplore);
      setFeatured(country.featured);
      setDisplayOrder(country.displayOrder);
      setRegion(country.region);
    } else if (mode === 'create') {
      setName('');
      setCode('');
      setPhoneCode('');
      setCurrency('');
      setActive(true);
      setAvailableForPartners(false);
      setVisibleInExplore(false);
      setFeatured(false);
      setDisplayOrder(0);
      setRegion(null);
    }

    setNameError(null);
    setCodeError(null);
  }, [open, mode, country]);

  const missingImageWarning = visibleInExplore && !country?.imagePath;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (trimmedName.length < 2) {
      setNameError(t('countries.form.nameRequired'));
      return;
    }

    setNameError(null);

    if (!/^[A-Z]{2,3}$/.test(trimmedCode)) {
      setCodeError(t('countries.form.codeInvalid'));
      return;
    }

    setCodeError(null);

    const trimmedPhoneCode = phoneCode.trim();
    const trimmedCurrency = currency.trim().toUpperCase();

    if (mode === 'create') {
      onCreate({
        name: trimmedName,
        code: trimmedCode,
        phoneCode: trimmedPhoneCode || null,
        currency: trimmedCurrency || null,
        active,
      });
      return;
    }

    if (!country) {
      return;
    }

    const identity: UpdateCountryInput = {};
    if (trimmedName !== country.name) identity.name = trimmedName;
    if (trimmedCode !== country.code) identity.code = trimmedCode;
    if (trimmedPhoneCode !== (country.phoneCode ?? ''))
      identity.phoneCode = trimmedPhoneCode || null;
    if (trimmedCurrency !== (country.currency ?? '')) identity.currency = trimmedCurrency || null;

    const availability: UpdateCountryAvailabilityInput = {};
    if (availableForPartners !== country.availableForPartners) {
      availability.availableForPartners = availableForPartners;
    }
    if (visibleInExplore !== country.visibleInExplore) {
      availability.visibleInExplore = visibleInExplore;
    }
    if (featured !== country.featured) {
      availability.featured = featured;
    }
    if (displayOrder !== country.displayOrder) {
      availability.displayOrder = displayOrder;
    }
    if (region !== country.region) {
      availability.region = region;
    }

    const hasIdentityChanges = Object.keys(identity).length > 0;
    const hasAvailabilityChanges = Object.keys(availability).length > 0;

    if (!hasIdentityChanges && !hasAvailabilityChanges) {
      onOpenChange(false);
      return;
    }

    onEditSubmit({
      identity: hasIdentityChanges ? identity : null,
      availability: hasAvailabilityChanges ? availability : null,
    });
  };

  const isReady = mode === 'create' || (!isLoading && country !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('countries.form.createTitle') : t('countries.form.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('countries.form.createDescription')
              : t('countries.form.editDescription')}
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
            <div className="grid max-h-[65vh] gap-4 overflow-y-auto py-2 pr-1">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {t('countries.form.identitySection')}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 grid gap-1.5">
                  <Label htmlFor="country-form-name">{t('countries.form.nameLabel')}</Label>
                  <Input
                    id="country-form-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    aria-invalid={nameError ? true : undefined}
                    maxLength={100}
                    required
                  />
                  {nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="country-form-code">{t('countries.form.codeLabel')}</Label>
                  <Input
                    id="country-form-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    aria-invalid={codeError ? true : undefined}
                    maxLength={3}
                    placeholder="PT"
                    required
                  />
                  {codeError ? <p className="text-xs text-destructive">{codeError}</p> : null}
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="country-form-phone-code">
                    {t('countries.form.phoneCodeLabel')}
                  </Label>
                  <Input
                    id="country-form-phone-code"
                    value={phoneCode}
                    onChange={(event) => setPhoneCode(event.target.value)}
                    placeholder="+351"
                    maxLength={6}
                  />
                </div>

                <div className="col-span-2 grid gap-1.5">
                  <Label htmlFor="country-form-currency">{t('countries.form.currencyLabel')}</Label>
                  <Input
                    id="country-form-currency"
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                    placeholder="EUR"
                    maxLength={3}
                  />
                </div>
              </div>

              {mode === 'create' ? (
                <>
                  <Separator />
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Label htmlFor="country-form-active">{t('countries.form.activeLabel')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('countries.form.activeHint')}
                      </p>
                    </div>
                    <Switch id="country-form-active" checked={active} onCheckedChange={setActive} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('countries.form.availabilityCreateHint')}
                  </p>
                </>
              ) : (
                country && (
                  <>
                    <Separator />
                    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {t('countries.form.availabilitySection')}
                    </h3>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label htmlFor="country-form-partners">
                          {t('countries.form.availableForPartnersLabel')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('countries.form.availableForPartnersHint')}
                        </p>
                      </div>
                      <Switch
                        id="country-form-partners"
                        checked={availableForPartners}
                        onCheckedChange={setAvailableForPartners}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label htmlFor="country-form-explore">
                          {t('countries.form.visibleInExploreLabel')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('countries.form.visibleInExploreHint')}
                        </p>
                      </div>
                      <Switch
                        id="country-form-explore"
                        checked={visibleInExplore}
                        onCheckedChange={setVisibleInExplore}
                      />
                    </div>
                    {missingImageWarning ? (
                      <p className="-mt-2 text-xs text-amber-600 dark:text-amber-400">
                        {t('countries.form.exploreRequiresImageWarning')}
                      </p>
                    ) : null}

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label htmlFor="country-form-featured">
                          {t('countries.form.featuredLabel')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('countries.form.featuredHint')}
                        </p>
                      </div>
                      <Switch
                        id="country-form-featured"
                        checked={featured}
                        onCheckedChange={setFeatured}
                      />
                    </div>

                    {visibleInExplore ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label htmlFor="country-form-order">
                            {t('countries.form.displayOrderLabel')}
                          </Label>
                          <Input
                            id="country-form-order"
                            type="number"
                            min={0}
                            value={displayOrder}
                            onChange={(event) => setDisplayOrder(Number(event.target.value) || 0)}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="country-form-region">
                            {t('countries.form.regionLabel')}
                          </Label>
                          <Select
                            value={region ?? NONE_REGION}
                            onValueChange={(value) =>
                              setRegion(value === NONE_REGION ? null : (value as CountryRegion))
                            }
                          >
                            <SelectTrigger id="country-form-region" className="w-full">
                              <SelectValue>
                                {(value: string) =>
                                  value === NONE_REGION
                                    ? t('countries.form.regionNone')
                                    : t(countryRegionLabelKey[value as CountryRegion])
                                }
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE_REGION}>
                                {t('countries.form.regionNone')}
                              </SelectItem>
                              {countryRegionOptions.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {t(countryRegionLabelKey[option])}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ) : null}

                    <Separator />
                    <CountryImageUploader
                      session={session}
                      country={country}
                      onUpdated={onCountryUpdated}
                    />

                    <Separator />
                    <div className="flex flex-col gap-2">
                      <Label>{t('countries.form.statusLabel')}</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                          tone={countryActiveTone[country.active ? 'active' : 'inactive']}
                          label={t(countryActiveLabelKey[country.active ? 'active' : 'inactive'])}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => onRequestStatusChange(country, !country.active)}
                        >
                          {country.active ? <PowerOff /> : <Power />}
                          {country.active
                            ? t('countries.actions.deactivate')
                            : t('countries.actions.activate')}
                        </Button>
                      </div>
                    </div>
                  </>
                )
              )}

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
                  ? t('countries.form.saving')
                  : mode === 'create'
                    ? t('countries.form.createConfirm')
                    : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CountryFormDialog;
