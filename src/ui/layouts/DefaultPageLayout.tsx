/*
 * Documentation:
 * Default Page Layout — https://app.subframe.com/3c939b2b64b7/library?component=Default+Page+Layout_a57b1c43-310a-493f-b807-8cc88e2452cf
 * Sidebar with large items — https://app.subframe.com/3c939b2b64b7/library?component=Sidebar+with+large+items_70c3656e-47c2-460e-8007-e198804e8862
 * Dropdown Menu — https://app.subframe.com/3c939b2b64b7/library?component=Dropdown+Menu_99951515-459b-4286-919e-a89e7549b43b
 * Avatar — https://app.subframe.com/3c939b2b64b7/library?component=Avatar_bec25ae6-5010-4485-b46b-cf79e3943ab2
 */

import React, { useEffect, useState } from 'react';
import * as SubframeUtils from '../utils';
import { SidebarWithLargeItems } from '../components/SidebarWithLargeItems';
import { FeatherHome } from '@subframe/core';
import { FeatherBell } from '@subframe/core';
import { FeatherInbox } from '@subframe/core';
import { FeatherBarChart2 } from '@subframe/core';
import { FeatherUser } from '@subframe/core';
import { FeatherSettings } from '@subframe/core';
import { DropdownMenu } from '../components/DropdownMenu';
import * as SubframeCore from '@subframe/core';
import { Avatar } from '../components/Avatar';
import { Toaster } from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router';
import supabase from '../../helper/supabaseClient';
import { Badge } from '../components/Badge';

interface DefaultPageLayoutRootProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  initialBadgeCount?: number;
  initialUserId?: string | null;
}

const DefaultPageLayoutRoot = React.forwardRef<
  HTMLElement,
  DefaultPageLayoutRootProps
>(function DefaultPageLayoutRoot(
  {
    children,
    className,
    initialBadgeCount,
    initialUserId,
    ...otherProps
  }: DefaultPageLayoutRootProps,
  ref
) {
  const location = useLocation();
  const [BadgeCount, setBadgeCount] = useState(initialBadgeCount ?? 0);
  const [badgeLoading, setBadgeLoading] = useState(true);

  const { hash, pathname, search } = location;
  const navigate = useNavigate();

  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    const getProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', user?.id)
        .single();
      setAvatarUrl(data?.avatar_url);
    };

    getProfile();
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      const effectiveUserId = initialUserId || user?.id;

      if (authError || !effectiveUserId) {
        if (isMounted) setBadgeLoading(false);
        return;
      }

      const cacheKey = `unread_count_${effectiveUserId}`;
      const cached = localStorage.getItem(cacheKey);
      if (isMounted && cached != null) setBadgeCount(Number(cached));

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', effectiveUserId)
        .eq('status', 'unread');

      if (!error && isMounted) {
        setBadgeCount(count || 0);
        localStorage.setItem(cacheKey, String(count || 0));
      }
      if (isMounted) setBadgeLoading(false);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Realtime subscription to update badge immediately
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = initialUserId || user?.id;
      if (!userId || !active) return;
      const cacheKey = `unread_count_${userId}`;

      const channel = supabase
        .channel('notifications_changes_app')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`,
          },
          (payload) => {
            const evt = payload.eventType;
            const newRow = payload.new as any;
            const oldRow = payload.old as any;
            let delta = 0;
            if (evt === 'INSERT') {
              if (
                newRow?.recipient_id === userId &&
                newRow?.status === 'unread'
              )
                delta = 1;
            } else if (evt === 'UPDATE') {
              if (newRow?.recipient_id === userId) {
                if (oldRow?.status === 'unread' && newRow?.status !== 'unread')
                  delta = -1;
                if (oldRow?.status !== 'unread' && newRow?.status === 'unread')
                  delta = 1;
              }
            } else if (evt === 'DELETE') {
              if (
                oldRow?.recipient_id === userId &&
                oldRow?.status === 'unread'
              )
                delta = -1;
            }
            if (delta !== 0) {
              setBadgeCount((prev) => {
                const next = Math.max(0, (prev || 0) + delta);
                localStorage.setItem(cacheKey, String(next));
                return next;
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      className={SubframeUtils.twClassNames(
        'flex h-screen w-full items-center',
        className
      )}
      ref={ref as any}
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
                <Avatar
                  image={
                    avatarUrl ||
                    'https://res.cloudinary.com/subframe/image/upload/v1751492213/uploads/16759/l3l2pvgu2os65s6q3wi6.png'
                  }
                />
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
                      navigate('/app/profile');
                    }}
                  >
                    Profile
                  </SidebarWithLargeItems.NavItem>
                  <SidebarWithLargeItems.NavItem
                    icon={<FeatherSettings />}
                    onClick={() => {
                      navigate('/app/settings');
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
        <Link to="/app/dashboard">
          <SidebarWithLargeItems.NavItem
            icon={<FeatherHome />}
            selected={pathname === '/app/dashboard'}
          >
            Home
          </SidebarWithLargeItems.NavItem>
        </Link>
        {/*<Link to="/app/notifications">
          <SidebarWithLargeItems.NavItem
            icon={<FeatherBell />}
            selected={pathname === '/app/notifications'}
          >
            Notifications
          </SidebarWithLargeItems.NavItem>
        </Link>*/}
        <Link to="/app/cases">
          <SidebarWithLargeItems.NavItem
            icon={<FeatherInbox />}
            selected={pathname.startsWith('/app/cases')}
            rightSlot={
              BadgeCount > 0 ? (
                <Badge
                  variant="error"
                  className="ml-2 px-2 py-0 text-xs rounded-full"
                >
                  {BadgeCount}
                </Badge>
              ) : null
            }
          >
            Cases
          </SidebarWithLargeItems.NavItem>
        </Link>
        <Link to="/app/billing">
          <SidebarWithLargeItems.NavItem 
          
          selected={pathname.startsWith('/app/billing')}
          icon={<FeatherBarChart2 />}>
            Billing
          </SidebarWithLargeItems.NavItem>
        </Link>
      </SidebarWithLargeItems>
      <Toaster position="top-right" />
      {children ? (
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background">
          {children}
        </div>
      ) : null}
    </div>
  );
});

export const DefaultPageLayout = DefaultPageLayoutRoot;
