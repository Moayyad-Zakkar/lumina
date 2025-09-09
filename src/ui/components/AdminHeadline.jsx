import { Link } from 'react-router';
import { Button } from './Button';
import { FeatherPlus } from '@subframe/core';

export default function AdminHeadline({ children }) {
  return (
    <div className="flex w-full items-center justify-between">
      <span className="text-heading-1 font-heading-1 text-default-font">
        {children}
      </span>
      <Link to="/admin/cases/new">
        <Button size="large" icon={<FeatherPlus />}>
          Submit New Case
        </Button>
      </Link>
    </div>
  );
}
