/*
 * Documentation:
 * Default Page Layout — https://app.subframe.com/3c939b2b64b7/library?component=Default+Page+Layout_a57b1c43-310a-493f-b807-8cc88e2452cf
 * Sidebar with large items — https://app.subframe.com/3c939b2b64b7/library?component=Sidebar+with+large+items_70c3656e-47c2-460e-8007-e198804e8862
 * Dropdown Menu — https://app.subframe.com/3c939b2b64b7/library?component=Dropdown+Menu_99951515-459b-4286-919e-a89e7549b43b
 * Avatar — https://app.subframe.com/3c939b2b64b7/library?component=Avatar_bec25ae6-5010-4485-b46b-cf79e3943ab2
 */

import React from 'react';
import * as SubframeUtils from '../utils';
import { SidebarWithLargeItems } from '../components/SidebarWithLargeItems';
import { FeatherHome } from '@subframe/core';
import { FeatherUsers } from '@subframe/core';
import { FeatherInbox } from '@subframe/core';
import { FeatherBarChart2 } from '@subframe/core';
import { FeatherUser } from '@subframe/core';
import { FeatherSettings } from '@subframe/core';
import { DropdownMenu } from '../components/DropdownMenu';
import * as SubframeCore from '@subframe/core';
import { Avatar } from '../components/Avatar';
import { Link, useLocation, useNavigate } from 'react-router';
import supabase from '../../helper/supabaseClient';
import { useEffect } from 'react';
import { fetchActionNeededCasesCount } from '../../helper/ActionStatuses';
import { useState } from 'react';
import { Badge } from '../components/Badge';

interface DefaultPageLayoutRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

const DefaultPageLayoutRoot = React.forwardRef<
  HTMLElement,
  DefaultPageLayoutRootProps
>(function DefaultPageLayoutRoot(
  { children, className, ...otherProps }: DefaultPageLayoutRootProps,
  ref
) {
  const location = useLocation();
  const { hash, pathname, search } = location;
  const navigate = useNavigate();

  const [casesNeedingAction, setCasesNeedingAction] = useState(0);

  useEffect(() => {
    async function getCount() {
      // For admin:
      const count = await fetchActionNeededCasesCount('admin');
      // For user, you need to pass userId:
      // const count = await fetchActionNeededCasesCount('user', userId);
      setCasesNeedingAction(count);
    }
    getCount();
  }, []);

  return (
    <div
      className={SubframeUtils.twClassNames(
        'flex h-screen w-full items-center',
        className
      )}
      ref={ref as any}
      {...otherProps}
    >
      <SidebarWithLargeItems
        className="mobile:hidden"
        header={
          <img
            className="flex-none"
            src="https://res.cloudinary.com/subframe/image/upload/v1751492213/uploads/16759/l3l2pvgu2os65s6q3wi6.png"
          />
        }
        footer={
          <SubframeCore.DropdownMenu.Root>
            <SubframeCore.DropdownMenu.Trigger asChild>
              <div className="cursor-pointer">
                <Avatar image="https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/fychrij7dzl8wgq2zjq9.avif">
                  A
                </Avatar>
              </div>
            </SubframeCore.DropdownMenu.Trigger>
            <SubframeCore.DropdownMenu.Portal>
              <SubframeCore.DropdownMenu.Content
                side="top"
                align="end"
                sideOffset={8}
                asChild
              >
                <DropdownMenu>
                  <SidebarWithLargeItems.NavItem
                    icon={<FeatherUser />}
                    onClick={() => {
                      navigate('/admin/profile');
                    }}
                  >
                    Profile
                  </SidebarWithLargeItems.NavItem>
                  <SidebarWithLargeItems.NavItem
                    icon={<FeatherSettings />}
                    onClick={() => {
                      navigate('/admin/settings');
                    }}
                  >
                    Settings
                  </SidebarWithLargeItems.NavItem>
                  <SidebarWithLargeItems.NavItem
                    icon={<SubframeCore.FeatherLogOut />}
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate('/'); // or a login route
                    }}
                  >
                    Sign Out
                  </SidebarWithLargeItems.NavItem>
                </DropdownMenu>
              </SubframeCore.DropdownMenu.Content>
            </SubframeCore.DropdownMenu.Portal>
          </SubframeCore.DropdownMenu.Root>
        }
      >
        <Link to="/admin/dashboard">
          <SidebarWithLargeItems.NavItem
            icon={<FeatherHome />}
            selected={pathname === '/admin/dashboard'}
          >
            Home
          </SidebarWithLargeItems.NavItem>
        </Link>
        <Link to="/admin/doctors">
          <SidebarWithLargeItems.NavItem
            icon={<FeatherUsers />}
            selected={pathname.startsWith('/admin/doctors')}
          >
            Doctors
          </SidebarWithLargeItems.NavItem>
        </Link>
        <Link to="/admin/cases">
          <SidebarWithLargeItems.NavItem
            icon={<FeatherInbox />}
            selected={pathname.startsWith('/admin/cases')}
            className=""
          >
            Cases
            {casesNeedingAction > 0 && (
              <Badge variant="error" className="ml-2">
                {casesNeedingAction}
              </Badge>
            )}
          </SidebarWithLargeItems.NavItem>
        </Link>
        <SidebarWithLargeItems.NavItem icon={<FeatherBarChart2 />}>
          Reports
        </SidebarWithLargeItems.NavItem>
      </SidebarWithLargeItems>
      {children ? (
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background">
          {children}
        </div>
      ) : null}
    </div>
  );
});

export const DefaultPageLayout = DefaultPageLayoutRoot;
