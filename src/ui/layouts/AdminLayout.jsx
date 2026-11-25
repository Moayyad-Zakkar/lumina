import { Outlet, useLoaderData, useNavigate } from 'react-router';
import { DefaultPageLayout } from './AdminPageLayout';
import { initPush } from '../../helper/pushNotifications';
import { useEffect } from 'react';

function AdminLayout() {
  const { initialBadgeCount, userId } = useLoaderData() || {};
  const navigate = useNavigate();
    // Register this phone for push notifications once the admin is logged in.
    useEffect(() => {
      initPush(navigate);
    }, [navigate]);
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

export default AdminLayout;
