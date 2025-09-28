import { Link } from 'react-router';
import { Button } from '../../ui/components/Button';
import { FeatherPlus } from '@subframe/core';

export default function Headline({ children, submit = true }) {
  return (
    <div className="flex w-full items-center justify-between">
      <span className="text-heading-1 font-heading-1 text-default-font">
        {children}
      </span>
      {submit && (
        <Link to="/app/cases/new">
          <Button size="large" icon={<FeatherPlus />}>
            Submit New Case
          </Button>
        </Link>
      )}
    </div>
  );
}
