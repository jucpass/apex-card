import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { PowerOff, Power } from 'lucide-react';
import type {
  CategoryDetails,
  CategoryIconValue,
  CreateCategoryInput,
  UpdateCategoryInput,
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import StatusBadge from '@/components/common/StatusBadge';
import CategoryIconPicker from '@/components/categories/CategoryIconPicker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  categoryActiveLabelKey,
  categoryActiveTone,
  slugifyCategoryName,
} from '@/lib/categoryFormatting';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type CategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  category: CategoryDetails | null;
  isLoading?: boolean;
  isSubmitting: boolean;
  errorMessage: string | null;
  onSubmit: (input: CreateCategoryInput | UpdateCategoryInput) => void;
  onRequestStatusChange?: (category: CategoryDetails, nextActive: boolean) => void;
};

function CategoryFormDialog({
  open,
  onOpenChange,
  mode,
  category,
  isLoading = false,
  isSubmitting,
  errorMessage,
  onSubmit,
  onRequestStatusChange,
}: CategoryFormDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [icon, setIcon] = useState<CategoryIconValue | null>(null);
  const [active, setActive] = useState(true);
  const [nameError, setNameError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === 'edit' && category) {
      setName(category.name);
      setSlug(category.slug);
      setIcon(category.icon);
      setActive(category.active);
    } else if (mode === 'create') {
      setName('');
      setSlug('');
      setIcon(null);
      setActive(true);
    }

    setSlugTouched(false);
    setNameError(null);
    setSlugError(null);
  }, [open, mode, category]);

  const handleNameChange = (value: string) => {
    setName(value);

    if (mode === 'create' && !slugTouched) {
      setSlug(slugifyCategoryName(value));
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

    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();

    if (trimmedName.length < 2) {
      setNameError(t('categories.form.nameRequired'));
      return;
    }

    setNameError(null);

    if (!SLUG_PATTERN.test(trimmedSlug)) {
      setSlugError(t('categories.form.slugInvalid'));
      return;
    }

    setSlugError(null);

    if (mode === 'create') {
      const input: CreateCategoryInput = {
        name: trimmedName,
        slug: trimmedSlug,
        icon,
        active,
      };
      onSubmit(input);
      return;
    }

    if (!category) {
      return;
    }

    const input: UpdateCategoryInput = {};

    if (trimmedName !== category.name) {
      input.name = trimmedName;
    }
    if (trimmedSlug !== category.slug) {
      input.slug = trimmedSlug;
    }
    if (icon !== category.icon) {
      input.icon = icon;
    }

    if (Object.keys(input).length === 0) {
      onOpenChange(false);
      return;
    }

    onSubmit(input);
  };

  const isReady = mode === 'create' || (!isLoading && category !== null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? t('categories.form.createTitle') : t('categories.form.editTitle')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('categories.form.createDescription')
              : t('categories.form.editDescription')}
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
                <Label htmlFor="category-form-name">{t('categories.form.nameLabel')}</Label>
                <Input
                  id="category-form-name"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  aria-invalid={nameError ? true : undefined}
                  maxLength={60}
                  required
                />
                {nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="category-form-slug">{t('categories.form.slugLabel')}</Label>
                <Input
                  id="category-form-slug"
                  value={slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  aria-invalid={slugError ? true : undefined}
                  maxLength={80}
                  required
                />
                {slugError ? (
                  <p className="text-xs text-destructive">{slugError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t('categories.form.slugHint')}</p>
                )}
              </div>

              <CategoryIconPicker id="category-form-icon" value={icon} onChange={setIcon} />

              {mode === 'create' ? (
                <div className="grid gap-1.5">
                  <Label htmlFor="category-form-active">{t('categories.form.activeLabel')}</Label>
                  <Select
                    value={active ? 'active' : 'inactive'}
                    onValueChange={(value) => setActive(value === 'active')}
                  >
                    <SelectTrigger id="category-form-active" className="w-full">
                      <SelectValue>
                        {(value: 'active' | 'inactive') => t(categoryActiveLabelKey[value])}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t(categoryActiveLabelKey.active)}</SelectItem>
                      <SelectItem value="inactive">{t(categoryActiveLabelKey.inactive)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : category ? (
                <>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <Label>{t('categories.form.activeLabel')}</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        tone={categoryActiveTone[category.active ? 'active' : 'inactive']}
                        label={t(categoryActiveLabelKey[category.active ? 'active' : 'inactive'])}
                      />
                      {onRequestStatusChange ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={() => onRequestStatusChange(category, !category.active)}
                        >
                          {category.active ? <PowerOff /> : <Power />}
                          {category.active
                            ? t('categories.actions.deactivate')
                            : t('categories.actions.activate')}
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
                  ? t('categories.form.saving')
                  : mode === 'create'
                    ? t('categories.form.createConfirm')
                    : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default CategoryFormDialog;
