import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Session } from '@supabase/supabase-js';
import { Loader2, Plus, X } from 'lucide-react';
import type {
  CategoryListItem,
  CategoryListResponse,
  PartnerDetails,
  PartnerDetailsResponse,
} from '@apex-card/shared';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/apiClient';
import { resolveCategoryIcon } from '@/lib/categoryIcons';

type PartnerCategoriesSectionProps = {
  session: Session;
  partner: PartnerDetails;
  onPartnerUpdated: (partner: PartnerDetails) => void;
  onFeedback: (feedback: { type: 'success' | 'error'; message: string }) => void;
};

function PartnerCategoriesSection({
  session,
  partner,
  onPartnerUpdated,
  onFeedback,
}: PartnerCategoriesSectionProps) {
  const { t } = useTranslation();
  const [activeCategories, setActiveCategories] = useState<CategoryListItem[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    void apiRequest<CategoryListResponse>(
      '/api/admin/categories?status=ACTIVE&sortBy=name&sortOrder=asc&pageSize=100',
      session
    )
      .then((result) => setActiveCategories(result.categories))
      .catch(() => setActiveCategories([]));
  }, [session]);

  const assignedIds = new Set(partner.categories.map((category) => category.categoryId));
  const availableCategories = activeCategories.filter((category) => !assignedIds.has(category.id));

  const saveCategories = async (categoryIds: string[], successKey: string) => {
    setIsBusy(true);

    try {
      const result = await apiRequest<PartnerDetailsResponse>(
        `/api/admin/partners/${partner.id}/categories`,
        session,
        { method: 'PUT', body: JSON.stringify({ categoryIds }) }
      );
      onPartnerUpdated(result.partner);
      onFeedback({ type: 'success', message: t(successKey) });
    } catch {
      onFeedback({ type: 'error', message: t('partners.categories.errors.updateFailed') });
    } finally {
      setIsBusy(false);
    }
  };

  const handleAssign = (categoryId: string | null) => {
    if (!categoryId || assignedIds.has(categoryId)) {
      return;
    }

    void saveCategories(
      [...partner.categories.map((category) => category.categoryId), categoryId],
      'partners.categories.success.assigned'
    );
  };

  const handleRemove = (categoryId: string) => {
    void saveCategories(
      partner.categories.map((category) => category.categoryId).filter((id) => id !== categoryId),
      'partners.categories.success.removed'
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span>{t('partners.categories.title')}</span>
          {isBusy ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {partner.categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('partners.categories.empty')}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {partner.categories.map((category) => {
              const Icon = resolveCategoryIcon(category.icon);

              return (
                <li
                  key={category.categoryId}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted py-1 pr-1 pl-2.5 text-sm text-foreground"
                >
                  <Icon className="size-3.5 text-muted-foreground" />
                  <span>{category.name}</span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="rounded-full"
                    disabled={isBusy}
                    aria-label={t('partners.categories.removeLabel', { name: category.name })}
                    onClick={() => handleRemove(category.categoryId)}
                  >
                    <X />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}

        {availableCategories.length > 0 ? (
          <div className="flex items-center gap-2">
            <Plus className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Select value={null} onValueChange={handleAssign}>
              <SelectTrigger
                aria-label={t('partners.categories.assign')}
                className="w-full sm:w-64"
                disabled={isBusy}
              >
                <SelectValue placeholder={t('partners.categories.assignPlaceholder')}>
                  {() => t('partners.categories.assignPlaceholder')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((category) => {
                  const Icon = resolveCategoryIcon(category.icon);

                  return (
                    <SelectItem key={category.id} value={category.id}>
                      <Icon className="size-4 text-muted-foreground" />
                      <span>{category.name}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {activeCategories.length === 0
              ? t('partners.categories.noneAvailable')
              : t('partners.categories.allAssigned')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default PartnerCategoriesSection;
