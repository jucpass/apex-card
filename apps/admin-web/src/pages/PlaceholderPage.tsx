import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import PageHeader from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

type PlaceholderPageProps = {
  titleKey: string;
};

function PlaceholderPage({ titleKey }: PlaceholderPageProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t(titleKey)} description={t('placeholder.description')} />
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Construction className="size-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t('placeholder.comingSoon')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default PlaceholderPage;
