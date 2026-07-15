import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '@supabase/supabase-js';
import { ImagePlus, Loader2, RefreshCw, Star, Trash2 } from 'lucide-react';
import type { PartnerDetails, PartnerDetailsResponse, PartnerMediaItem } from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MemberConfirmDialog from '@/components/members/MemberConfirmDialog';
import { ApiError, apiRequest, apiUpload } from '@/lib/apiClient';
import {
  ACCEPTED_PARTNER_IMAGE_TYPES,
  MAX_PARTNER_IMAGE_BYTES,
  PARTNER_MEDIA_MAX,
} from '@/lib/partnerFormatting';

type PartnerMediaSectionProps = {
  session: Session;
  partner: PartnerDetails;
  onPartnerUpdated: (partner: PartnerDetails) => void;
  onFeedback: (feedback: { type: 'success' | 'error'; message: string }) => void;
};

function PartnerMediaSection({
  session,
  partner,
  onPartnerUpdated,
  onFeedback,
}: PartnerMediaSectionProps) {
  const { t } = useTranslation();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceTargetRef = useRef<string | null>(null);

  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PartnerMediaItem | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const remainingSlots = PARTNER_MEDIA_MAX - partner.media.length;

  const validateFiles = (files: File[]): string | null => {
    for (const file of files) {
      if (!ACCEPTED_PARTNER_IMAGE_TYPES.includes(file.type)) {
        return t('partners.media.errors.invalidType');
      }

      if (file.size === 0 || file.size > MAX_PARTNER_IMAGE_BYTES) {
        return file.size === 0
          ? t('partners.media.errors.invalidType')
          : t('partners.media.errors.tooLarge');
      }
    }

    return null;
  };

  const handleUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    setError(null);

    if (files.length > remainingSlots) {
      setError(t('partners.media.errors.tooMany', { max: PARTNER_MEDIA_MAX }));
      return;
    }

    const validationError = validateFiles(files);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsBusy(true);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));

      const result = await apiUpload<PartnerDetailsResponse>(
        `/api/admin/partners/${partner.id}/media`,
        session,
        formData
      );
      onPartnerUpdated(result.partner);
      onFeedback({ type: 'success', message: t('partners.media.success.uploaded') });
    } catch (uploadError) {
      setError(
        uploadError instanceof ApiError
          ? uploadError.message
          : t('partners.media.errors.uploadFailed')
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleReplaceChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const mediaId = replaceTargetRef.current;
    event.target.value = '';
    replaceTargetRef.current = null;

    if (!file || !mediaId) {
      return;
    }

    setError(null);

    const validationError = validateFiles([file]);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsBusy(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const result = await apiUpload<PartnerDetailsResponse>(
        `/api/admin/partners/${partner.id}/media/${mediaId}/replace`,
        session,
        formData
      );
      onPartnerUpdated(result.partner);
      onFeedback({ type: 'success', message: t('partners.media.success.replaced') });
    } catch (replaceError) {
      setError(
        replaceError instanceof ApiError
          ? replaceError.message
          : t('partners.media.errors.uploadFailed')
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleSetCover = async (media: PartnerMediaItem) => {
    setError(null);
    setIsBusy(true);

    try {
      const result = await apiRequest<PartnerDetailsResponse>(
        `/api/admin/partners/${partner.id}/media/${media.id}/cover`,
        session,
        { method: 'PATCH' }
      );
      onPartnerUpdated(result.partner);
      onFeedback({ type: 'success', message: t('partners.media.success.coverSet') });
    } catch {
      setError(t('partners.media.errors.coverFailed'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsConfirmLoading(true);
    setError(null);

    try {
      const result = await apiRequest<PartnerDetailsResponse>(
        `/api/admin/partners/${partner.id}/media/${deleteTarget.id}`,
        session,
        { method: 'DELETE' }
      );
      onPartnerUpdated(result.partner);
      onFeedback({ type: 'success', message: t('partners.media.success.removed') });
    } catch (deleteError) {
      setError(
        deleteError instanceof ApiError
          ? deleteError.message
          : t('partners.media.errors.removeFailed')
      );
    } finally {
      setIsConfirmLoading(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>{t('partners.media.title')}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {t('partners.media.slotsRemaining', { count: remainingSlots })}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-xs text-muted-foreground">{t('partners.media.rulesHint')}</p>

        {partner.media.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('partners.media.empty')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {partner.media.map((media, index) => (
              <div
                key={media.id}
                className="flex flex-col gap-2 rounded-lg p-2 ring-1 ring-foreground/10"
              >
                <div className="relative aspect-video overflow-hidden rounded-md bg-muted">
                  {media.imageUrl ? (
                    <img
                      src={media.imageUrl}
                      alt={t('partners.media.imageAlt', {
                        name: partner.name,
                        position: index + 1,
                      })}
                      className="size-full object-cover"
                    />
                  ) : null}
                  {media.isCover ? (
                    <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-foreground/80 px-1.5 py-0.5 text-[10px] font-medium text-background">
                      <Star className="size-3" />
                      {t('partners.media.coverBadge')}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-xs text-muted-foreground">
                    {t('partners.media.position', { position: index + 1 })}
                  </span>
                  <div className="flex items-center gap-1">
                    {!media.isCover ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        disabled={isBusy}
                        aria-label={t('partners.media.setCover')}
                        title={t('partners.media.setCover')}
                        onClick={() => void handleSetCover(media)}
                      >
                        <Star />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isBusy}
                      aria-label={t('partners.media.replace')}
                      title={t('partners.media.replace')}
                      onClick={() => {
                        replaceTargetRef.current = media.id;
                        replaceInputRef.current?.click();
                      }}
                    >
                      <RefreshCw />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={isBusy}
                      aria-label={t('partners.media.remove')}
                      title={t('partners.media.remove')}
                      onClick={() => setDeleteTarget(media)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy || remainingSlots === 0}
            onClick={() => uploadInputRef.current?.click()}
          >
            {isBusy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {t('partners.media.upload')}
          </Button>
          {remainingSlots === 0 ? (
            <span className="text-xs text-muted-foreground">{t('partners.media.slotsFull')}</span>
          ) : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <input
          ref={uploadInputRef}
          type="file"
          accept={ACCEPTED_PARTNER_IMAGE_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={(event) => void handleUploadChange(event)}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept={ACCEPTED_PARTNER_IMAGE_TYPES.join(',')}
          className="hidden"
          onChange={(event) => void handleReplaceChange(event)}
        />

        <MemberConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open) {
              setDeleteTarget(null);
            }
          }}
          title={t('partners.media.confirmRemoveTitle')}
          description={t('partners.media.confirmRemoveDescription')}
          confirmLabel={t('partners.media.remove')}
          destructive
          loading={isConfirmLoading}
          onConfirm={() => void handleConfirmDelete()}
        />
      </CardContent>
    </Card>
  );
}

export default PartnerMediaSection;
