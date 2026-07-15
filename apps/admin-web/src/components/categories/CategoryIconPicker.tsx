import { useTranslation } from 'react-i18next';
import type { CategoryIconValue } from '@apex-card/shared';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categoryIconOptions, resolveCategoryIcon } from '@/lib/categoryIcons';

const NONE_VALUE = '__none__';

type CategoryIconPickerProps = {
  id: string;
  value: CategoryIconValue | null;
  onChange: (value: CategoryIconValue | null) => void;
};

function CategoryIconPicker({ id, value, onChange }: CategoryIconPickerProps) {
  const { t } = useTranslation();
  const PreviewIcon = resolveCategoryIcon(value);
  const selectValue = value ?? NONE_VALUE;

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{t('categories.form.iconLabel')}</Label>
      <div className="flex items-center gap-2">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          <PreviewIcon className="size-4" />
        </span>
        <Select
          value={selectValue}
          onValueChange={(next) =>
            onChange(next === NONE_VALUE ? null : (next as CategoryIconValue))
          }
        >
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder={t('categories.form.iconNone')}>
              {(current: string) =>
                current === NONE_VALUE
                  ? t('categories.form.iconNone')
                  : t(`categories.icons.${current}`)
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>{t('categories.form.iconNone')}</SelectItem>
            {categoryIconOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <option.icon className="size-4 text-muted-foreground" />
                <span>{t(`categories.icons.${option.value}`)}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default CategoryIconPicker;
