import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Pencil,
  Percent,
  Power,
  PowerOff,
  Star,
  ThumbsUp,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  CountriesResponse,
  CountryDto,
  CreatePartnerInput,
  PartnerDetails,
  PartnerDetailsResponse,
} from '@apex-card/shared';

import PageHeader from '@/components/common/PageHeader';
import StatusBadge from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import MemberConfirmDialog from '@/components/members/MemberConfirmDialog';
import PartnerForm from '@/components/partners/PartnerForm';
import PartnerCategoriesSection from '@/components/partners/PartnerCategoriesSection';
import PartnerMediaSection from '@/components/partners/PartnerMediaSection';
import { ApiError, apiRequest } from '@/lib/apiClient';
import {
  formatPartnerDate,
  partnerStatusLabelKey,
  partnerStatusTone,
} from '@/lib/partnerFormatting';

type PartnerDetailsPageProps = {
  session: Session;
};

type FeedbackState = {
  type: 'success' | 'error';
  message: string;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm break-words text-foreground">{value}</span>
    </div>
  );
}

/**
 * Placeholder tiles for the Partner-configuration areas that later roadmap tasks
 * (Locations, Discounts, Media, Featured, Ratings, Analytics) will replace one by one —
 * each future task swaps its tile for a real section inside this same workspace.
 */
const CONFIGURATION_PLACEHOLDERS: { key: string; labelKey: string; icon: LucideIcon }[] = [
  { key: 'locations', labelKey: 'partners.details.config.locations', icon: MapPin },
  { key: 'discounts', labelKey: 'partners.details.config.discounts', icon: Percent },
  { key: 'featured', labelKey: 'partners.details.config.featured', icon: Star },
  { key: 'ratings', labelKey: 'partners.details.config.ratings', icon: ThumbsUp },
  { key: 'analytics', labelKey: 'partners.details.config.analytics', icon: BarChart3 },
];

function PartnerDetailsPage({ session }: PartnerDetailsPageProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [partner, setPartner] = useState<PartnerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<'notFound' | 'generic' | null>(null);
  const [countries, setCountries] = useState<CountryDto[]>([]);

  const isEditing = searchParams.get('edit') === '1';
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const navState = location.state as { created?: boolean; mediaError?: boolean } | null;
  const [feedback, setFeedback] = useState<FeedbackState | null>(
    navState?.mediaError
      ? { type: 'error', message: t('partners.media.errors.createUploadFailed') }
      : navState?.created
        ? { type: 'success', message: t('partners.success.created') }
        : null
  );

  const [statusChange, setStatusChange] = useState<'ACTIVE' | 'INACTIVE' | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const setEditing = useCallback(
    (editing: boolean) => {
      setSearchParams(editing ? { edit: '1' } : {}, { replace: true });
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    void apiRequest<PartnerDetailsResponse>(`/api/admin/partners/${id}`, session)
      .then((result) => setPartner(result.partner))
      .catch((error) => {
        setLoadError(error instanceof ApiError && error.status === 404 ? 'notFound' : 'generic');
      })
      .finally(() => setIsLoading(false));
  }, [id, session]);

  useEffect(() => {
    void apiRequest<CountriesResponse>('/api/admin/countries/options', session)
      .then((result) => setCountries(result.countries))
      .catch(() => setCountries([]));
  }, [session]);

  const handleEditSubmit = async (input: CreatePartnerInput) => {
    if (!partner) {
      return;
    }

    setIsSubmitting(true);
    setEditError(null);

    try {
      const result = await apiRequest<PartnerDetailsResponse>(
        `/api/admin/partners/${partner.id}`,
        session,
        { method: 'PATCH', body: JSON.stringify(input) }
      );
      setPartner(result.partner);
      setEditing(false);
      setFeedback({ type: 'success', message: t('partners.success.updated') });
    } catch (error) {
      setEditError(
        error instanceof ApiError && (error.status === 409 || error.status === 400)
          ? error.message
          : t('partners.errors.updateFailed')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!partner || !statusChange) {
      return;
    }

    setIsConfirmLoading(true);

    try {
      const result = await apiRequest<PartnerDetailsResponse>(
        `/api/admin/partners/${partner.id}/status`,
        session,
        { method: 'PATCH', body: JSON.stringify({ status: statusChange }) }
      );
      setPartner(result.partner);
      setFeedback({
        type: 'success',
        message: t(
          statusChange === 'ACTIVE' ? 'partners.success.activated' : 'partners.success.deactivated',
          { name: partner.name }
        ),
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof ApiError && error.status === 400 && statusChange === 'ACTIVE'
            ? t('partners.errors.activationRequiresImage')
            : t('partners.errors.statusUpdateFailed'),
      });
    } finally {
      setIsConfirmLoading(false);
      setStatusChange(null);
    }
  };

  const confirmCopy = useMemo(() => {
    if (!statusChange || !partner) {
      return null;
    }

    return statusChange === 'ACTIVE'
      ? {
          title: t('partners.confirm.activateTitle'),
          description: t('partners.confirm.activateDescription', { name: partner.name }),
          confirmLabel: t('partners.actions.activate'),
          destructive: false,
        }
      : {
          title: t('partners.confirm.deactivateTitle'),
          description: t('partners.confirm.deactivateDescription', { name: partner.name }),
          confirmLabel: t('partners.actions.deactivate'),
          destructive: true,
        };
  }, [statusChange, partner, t]);

  const notProvided = t('partners.details.notProvided');

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (loadError || !partner) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl py-16 text-center ring-1 ring-foreground/10">
        <AlertTriangle className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          {loadError === 'notFound'
            ? t('partners.errors.notFound')
            : t('partners.errors.loadOneFailed')}
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/partners')}>
          {t('partners.createPage.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={partner.name}
        description={t('partners.details.description')}
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/admin/partners')}>
              <ArrowLeft />
              {t('partners.createPage.backToList')}
            </Button>
            {!isEditing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil />
                  {t('partners.actions.edit')}
                </Button>
                {partner.status === 'ACTIVE' ? (
                  <Button variant="destructive" onClick={() => setStatusChange('INACTIVE')}>
                    <PowerOff />
                    {t('partners.actions.deactivate')}
                  </Button>
                ) : (
                  <Button onClick={() => setStatusChange('ACTIVE')}>
                    <Power />
                    {t('partners.actions.activate')}
                  </Button>
                )}
              </>
            ) : null}
          </>
        }
      />

      {feedback ? (
        <div
          className={`flex items-center justify-between gap-3 rounded-lg p-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          <span className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="size-4 shrink-0" />
            ) : (
              <AlertTriangle className="size-4 shrink-0" />
            )}
            {feedback.message}
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setFeedback(null)}
            aria-label={t('common.cancel')}
          >
            <X />
          </Button>
        </div>
      ) : null}

      {partner.status === 'ACTIVE' ? (
        <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-4 shrink-0" />
          {t('partners.details.activeConfigNote')}
        </div>
      ) : null}

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('partners.details.editTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <PartnerForm
              mode="edit"
              initial={partner}
              countries={countries}
              session={session}
              isSubmitting={isSubmitting}
              errorMessage={editError}
              onSubmit={(input) => void handleEditSubmit(input)}
              onCancel={() => {
                setEditError(null);
                setEditing(false);
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('partners.details.overviewTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  tone={partnerStatusTone[partner.status]}
                  label={t(partnerStatusLabelKey[partner.status])}
                />
                <span className="font-mono text-xs text-muted-foreground">/{partner.slug}</span>
              </div>
              <DetailRow label={t('partners.form.nameLabel')} value={partner.name} />
              <DetailRow
                label={t('partners.form.descriptionLabel')}
                value={partner.description || notProvided}
              />
              <div className="grid grid-cols-2 gap-3">
                <DetailRow
                  label={t('partners.details.createdAt')}
                  value={formatPartnerDate(partner.createdAt, i18n.language)}
                />
                <DetailRow
                  label={t('partners.details.updatedAt')}
                  value={formatPartnerDate(partner.updatedAt, i18n.language)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('partners.details.contactTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <DetailRow
                label={t('partners.form.emailLabel')}
                value={partner.email || notProvided}
              />
              <DetailRow
                label={t('partners.form.phoneLabel')}
                value={partner.phone || notProvided}
              />
              <DetailRow
                label={t('partners.form.whatsappLabel')}
                value={partner.whatsapp || notProvided}
              />
              <DetailRow
                label={t('partners.form.websiteLabel')}
                value={partner.website || notProvided}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('partners.details.addressTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <DetailRow
                label={t('partners.form.addressLine1Label')}
                value={partner.addressLine1 || notProvided}
              />
              <DetailRow
                label={t('partners.form.addressLine2Label')}
                value={partner.addressLine2 || notProvided}
              />
              <DetailRow label={t('partners.form.countryLabel')} value={partner.countryName} />
              <DetailRow
                label={t('partners.form.cityLabel')}
                value={partner.cityName || notProvided}
              />
              <DetailRow
                label={t('partners.form.postalCodeLabel')}
                value={partner.postalCode || notProvided}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  {t('partners.form.googleMapsUrlLabel')}
                </span>
                {partner.googleMapsUrl ? (
                  <a
                    href={partner.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-foreground underline-offset-4 hover:underline"
                  >
                    {t('partners.details.openInMaps')}
                    <ExternalLink className="size-3.5" />
                  </a>
                ) : (
                  <span className="text-sm text-foreground">{notProvided}</span>
                )}
              </div>
              {partner.latitude !== null && partner.longitude !== null ? (
                <DetailRow
                  label={t('partners.details.coordinates')}
                  value={`${partner.latitude}, ${partner.longitude}`}
                />
              ) : null}
            </CardContent>
          </Card>

          <PartnerCategoriesSection
            session={session}
            partner={partner}
            onPartnerUpdated={setPartner}
            onFeedback={setFeedback}
          />

          <div className="lg:col-span-2">
            <PartnerMediaSection
              session={session}
              partner={partner}
              onPartnerUpdated={setPartner}
              onFeedback={setFeedback}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('partners.details.configTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CONFIGURATION_PLACEHOLDERS.map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-col gap-1 rounded-lg bg-muted/50 p-3 ring-1 ring-foreground/5"
                  >
                    <item.icon className="size-4 text-muted-foreground" />
                    <p className="text-xs font-medium text-foreground">{t(item.labelKey)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('partners.details.config.notConfigured')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {confirmCopy ? (
        <MemberConfirmDialog
          open={Boolean(statusChange)}
          onOpenChange={(open) => {
            if (!open) {
              setStatusChange(null);
            }
          }}
          title={confirmCopy.title}
          description={confirmCopy.description}
          confirmLabel={confirmCopy.confirmLabel}
          destructive={confirmCopy.destructive}
          loading={isConfirmLoading}
          onConfirm={() => void handleConfirmStatusChange()}
        />
      ) : null}
    </div>
  );
}

export default PartnerDetailsPage;
