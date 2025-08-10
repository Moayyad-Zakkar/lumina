import { Outlet } from 'react-router';
import { DefaultPageLayout } from './AdminPageLayout';

function AdminLayout() {
  return (
    <DefaultPageLayout>
      <div className="container max-w-none flex w-full flex-col items-start gap-4 bg-default-background py-12">
        <Outlet />
      </div>
    </DefaultPageLayout>
  );
}

export default AdminLayout;
