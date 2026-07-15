import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ImagePlus, X } from 'lucide-react';
import type {
  CountriesResponse,
  CountryDto,
  CreatePartnerInput,
  PartnerDetailsResponse,
} from '@apex-card/shared';

import PageHeader from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PartnerForm from '@/components/partners/PartnerForm';
import { ApiError, apiRequest, apiUpload } from '@/lib/apiClient';
import {
  ACCEPTED_PARTNER_IMAGE_TYPES,
  MAX_PARTNER_IMAGE_BYTES,
  PARTNER_MEDIA_MAX,
} from '@/lib/partnerFormatting';

type PartnerCreatePageProps = {
  session: Session;
};

type PendingImage = {
  file: File;
  previewUrl: string;
};

function PartnerCreatePage({ session }: PartnerCreatePageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [countries, setCountries] = useState<CountryDto[]>([]);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void apiRequest<CountriesResponse>('/api/admin/countries/options', session)
      .then((result) => setCountries(result.countries))
      .catch(() => setCountries([]));
  }, [session]);

  useEffect(
    () => () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    },
    // Revoke only on unmount — individual removals revoke their own URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    setImageError(null);

    if (files.length === 0) {
      return;
    }

    if (images.length + files.length > PARTNER_MEDIA_MAX) {
      setImageError(t('partners.media.errors.tooMany', { max: PARTNER_MEDIA_MAX }));
      return;
    }

    for (const file of files) {
      if (!ACCEPTED_PARTNER_IMAGE_TYPES.includes(file.type)) {
        setImageError(t('partners.media.errors.invalidType'));
        return;
      }

      if (file.size === 0 || file.size > MAX_PARTNER_IMAGE_BYTES) {
        setImageError(
          file.size === 0
            ? t('partners.media.errors.invalidType')
            : t('partners.media.errors.tooLarge')
        );
        return;
      }
    }

    setImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })),
    ]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const target = prev[index];

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleSubmit = async (input: CreatePartnerInput) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await apiRequest<PartnerDetailsResponse>('/api/admin/partners', session, {
        method: 'POST',
        body: JSON.stringify(input),
      });

      let mediaError = false;

      if (images.length > 0) {
        try {
          const formData = new FormData();
          images.forEach((image) => formData.append('images', image.file));
          await apiUpload<PartnerDetailsResponse>(
            `/api/admin/partners/${result.partner.id}/media`,
            session,
            formData
          );
        } catch {
          // The Draft partner exists — surface the failure on the workspace so the
          // admin can retry from its Media section instead of losing the whole form.
          mediaError = true;
        }
      }

      navigate(`/admin/partners/${result.partner.id}`, {
        state: { created: true, mediaError },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError && (error.status === 409 || error.status === 400)
          ? error.message
          : t('partners.errors.createFailed')
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={t('partners.createPage.title')}
        description={t('partners.createPage.description')}
        actions={
          <Button variant="outline" onClick={() => navigate('/admin/partners')}>
            <ArrowLeft />
            {t('partners.createPage.backToList')}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            <span>{t('partners.media.title')}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {t('partners.media.slotsRemaining', { count: PARTNER_MEDIA_MAX - images.length })}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">{t('partners.media.rulesHint')}</p>

          {images.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {images.map((image, index) => (
                <div
                  key={image.previewUrl}
                  className="relative aspect-video overflow-hidden rounded-lg ring-1 ring-foreground/10"
                >
                  <img
                    src={image.previewUrl}
                    alt={t('partners.media.pendingImageAlt', { position: index + 1 })}
                    className="size-full object-cover"
                  />
                  {index === 0 ? (
                    <span className="absolute top-1.5 left-1.5 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[10px] font-medium text-background">
                      {t('partners.media.coverBadge')}
                    </span>
                  ) : null}
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon-xs"
                    className="absolute top-1.5 right-1.5"
                    aria-label={t('partners.media.remove')}
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting || images.length >= PARTNER_MEDIA_MAX}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus />
              {t('partners.media.select')}
            </Button>
          </div>

          {imageError ? <p className="text-sm text-destructive">{imageError}</p> : null}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_PARTNER_IMAGE_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={handleFilesChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <PartnerForm
            mode="create"
            initial={null}
            countries={countries}
            session={session}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            onSubmit={(input) => void handleSubmit(input)}
            onCancel={() => navigate('/admin/partners')}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default PartnerCreatePage;
