import { Outlet, useLoaderData } from 'react-router';
import { DefaultPageLayout } from './DefaultPageLayout';

function UserLayout() {
  const { initialBadgeCount, userId } = useLoaderData() || {};
  return (
    <DefaultPageLayout
      initialBadgeCount={initialBadgeCount}
      initialUserId={userId}
    >
      <div className="container max-w-none flex w-full flex-col items-start gap-4 bg-default-background py-12">
        <Outlet />
      </div>
    </DefaultPageLayout>
  );
}

export default UserLayout;
