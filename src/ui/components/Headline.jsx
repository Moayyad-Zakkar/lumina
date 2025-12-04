import { Link } from 'react-router';
import { Button } from '../../ui/components/Button';
import { FeatherPlus } from '@subframe/core';
import { useTranslation } from 'react-i18next';

export default function Headline({ children, submit = true }) {
  const { t } = useTranslation();
  return (
    <div className="flex w-full items-center justify-between">
      <span className="text-heading-1 font-heading-1 text-default-font">
        {children}
      </span>
      {submit && (
        <Link to="/app/cases/new">
          <Button size="large" icon={<FeatherPlus />} className="h-9">
            {t('caseSubmit.submitCaseButton')}
          </Button>
        </Link>
      )}
    </div>
  );
}
