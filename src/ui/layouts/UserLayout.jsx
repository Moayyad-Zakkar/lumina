import { Outlet } from 'react-router';
import { DefaultPageLayout } from './DefaultPageLayout';

function UserLayout() {
  return (
    <DefaultPageLayout>
      <div className="container max-w-none flex w-full flex-col items-start gap-4 bg-default-background py-12">
        <Outlet />
      </div>
    </DefaultPageLayout>
  );
}

export default UserLayout;
