import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '@supabase/supabase-js';
import { ImageOff, Loader2, Upload, X } from 'lucide-react';
import type { CountryDetails, CountryDetailsResponse } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, apiRequest, apiUpload } from '@/lib/apiClient';
import { ACCEPTED_COUNTRY_IMAGE_TYPES, MAX_COUNTRY_IMAGE_BYTES } from '@/lib/countryFormatting';

type CountryImageUploaderProps = {
  session: Session;
  country: CountryDetails;
  onUpdated: (country: CountryDetails) => void;
};

function CountryImageUploader({ session, country, onUpdated }: CountryImageUploaderProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [altText, setAltText] = useState(country.imageAltText ?? '');
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = previewUrl ?? country.imageUrl;

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setError(null);

    if (!ACCEPTED_COUNTRY_IMAGE_TYPES.includes(file.type)) {
      setError(t('countries.image.errors.invalidType'));
      return;
    }

    if (file.size > MAX_COUNTRY_IMAGE_BYTES) {
      setError(t('countries.image.errors.tooLarge'));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      if (altText.trim()) {
        formData.append('altText', altText.trim());
      }

      const result = await apiUpload<CountryDetailsResponse>(
        `/api/admin/countries/${country.id}/image`,
        session,
        formData
      );

      onUpdated(result.country);
    } catch (uploadError) {
      setError(
        uploadError instanceof ApiError
          ? uploadError.message
          : t('countries.image.errors.uploadFailed')
      );
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    setIsRemoving(true);

    try {
      const result = await apiRequest<CountryDetailsResponse>(
        `/api/admin/countries/${country.id}/image`,
        session,
        { method: 'DELETE' }
      );
      onUpdated(result.country);
    } catch {
      setError(t('countries.image.errors.removeFailed'));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="grid gap-2">
      <Label>{t('countries.image.label')}</Label>

      <div className="flex items-start gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={country.imageAltText ?? ''}
              className="size-full object-cover"
            />
          ) : (
            <ImageOff className="size-6 text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading || isRemoving}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
              {country.imagePath ? t('countries.image.replace') : t('countries.image.upload')}
            </Button>
            {country.imagePath ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isUploading || isRemoving}
                onClick={() => void handleRemove()}
              >
                {isRemoving ? <Loader2 className="animate-spin" /> : <X />}
                {t('countries.image.remove')}
              </Button>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_COUNTRY_IMAGE_TYPES.join(',')}
              className="hidden"
              onChange={(event) => void handleFileChange(event)}
            />
          </div>

          <Input
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            placeholder={t('countries.image.altTextPlaceholder')}
            maxLength={200}
            aria-label={t('countries.image.altTextLabel')}
          />

          <p className="text-xs text-muted-foreground">{t('countries.image.hint')}</p>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default CountryImageUploader;
