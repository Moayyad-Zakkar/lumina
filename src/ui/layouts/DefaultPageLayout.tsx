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
import {
  FeatherHome,
  FeatherInbox,
  FeatherShoppingBag,
  FeatherBarChart2,
  FeatherUser,
  FeatherSettings,
  FeatherMenu,
  FeatherX,
} from '@subframe/core';
import { DropdownMenu } from '../components/DropdownMenu';
import * as SubframeCore from '@subframe/core';
import { Avatar } from '../components/Avatar';
import { Toaster } from 'react-hot-toast';
import { Link, useLocation, useNavigate } from 'react-router';
import supabase from '../../helper/supabaseClient';
import { Badge } from '../components/Badge';
import { useTranslation } from 'react-i18next';
import { unregisterPush } from '../../helper/pushNotifications';
import NotificationBell from '../components/NotificationBell';

interface DefaultPageLayoutRootProps extends React.HTMLAttributes<HTMLDivElement> {
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
  ref,
) {
  const location = useLocation();
  const { t } = useTranslation();
  const [BadgeCount, setBadgeCount] = useState(initialBadgeCount ?? 0);
  const [badgeLoading, setBadgeLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { hash, pathname, search } = location;
  const navigate = useNavigate();

  const [avatarUrl, setAvatarUrl] = useState(null);

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
    let active = true;
    let channel: any = null;
  
    const refresh = async (userId: string) => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('type', 'case')
        .eq('status', 'unread');
      if (!error && active) {
        setBadgeCount(count || 0);
        localStorage.setItem(`unread_count_${userId}`, String(count || 0));
      }
    };
  
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const userId = initialUserId || user?.id;
      if (!userId || !active) {
        setBadgeLoading(false);
        return;
      }
  
      const cached = localStorage.getItem(`unread_count_${userId}`);
      if (cached != null) setBadgeCount(Number(cached));
  
      await refresh(userId);
      if (!active) return;           
setBadgeLoading(false);
  
      channel = supabase
        .channel(`cases_badge_${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`,
          },
          () => refresh(userId),
        )
        .subscribe();
    })();
  
    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div
      className={SubframeUtils.twClassNames(
        'flex h-screen w-full flex-col md:flex-row items-center', // Stack vertically on mobile
        className,
      )}
      ref={ref as any}
    >
      {/* MOBILE HEADER - Only visible on small screens */}
      <div className="flex md:hidden w-full px-4 py-3 items-center justify-between border-b border-component-divider bg-default-background z-20">
        <img className="h-8" src="/logo.png" alt="logo" />
        <div className="flex items-center gap-2">
  <NotificationBell mode="popover" role="user" />
  <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-subtext-color">
    {isMobileMenuOpen ? <FeatherX /> : <FeatherMenu />}
  </button>
</div>
      </div>

      {/* DESKTOP SIDEBAR - Hidden on mobile */}
      <SidebarWithLargeItems
        className="hidden md:flex"
        header={<img className="flex-none" src="/logo.png" />}
        footer={
          <div className="flex flex-col items-center gap-3">
            <NotificationBell mode="popover" role="user" />
          <SubframeCore.DropdownMenu.Root>
            <SubframeCore.DropdownMenu.Trigger asChild>
              <div className="cursor-pointer">
                <Avatar
                  image={avatarUrl || '/favicon.png'}
                  className="shadow-md shadow-brand-300/50"
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
                    {t('navigation.profile')}
                  </SidebarWithLargeItems.NavItem>
                  <SidebarWithLargeItems.NavItem
                    icon={<FeatherSettings />}
                    onClick={() => {
                      navigate('/app/settings');
                    }}
                  >
                    {t('navigation.settings')}
                  </SidebarWithLargeItems.NavItem>
                  <SidebarWithLargeItems.NavItem
                    icon={<SubframeCore.FeatherLogOut />}
                    onClick={async () => {
                      await unregisterPush();
                      await supabase.auth.signOut();
                      navigate('/'); // or a login route
                    }}
                  >
                    {t('navigation.signOut')}
                  </SidebarWithLargeItems.NavItem>
                </DropdownMenu>
              </SubframeCore.DropdownMenu.Content>
            </SubframeCore.DropdownMenu.Portal>
          </SubframeCore.DropdownMenu.Root>
          </div>
        }
      >
        <Link to="/app/dashboard">
          <SidebarWithLargeItems.NavItem
            icon={<FeatherHome />}
            selected={pathname === '/app/dashboard'}
          >
            {t('navigation.home')}
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
            {t('navigation.cases')}
          </SidebarWithLargeItems.NavItem>
        </Link>
        <Link to="/app/store">
          <SidebarWithLargeItems.NavItem
            icon={<FeatherShoppingBag />}
            selected={pathname.startsWith('/app/store')}
            rightSlot={<Badge variant="brand">{t('common.new')}</Badge>}
          >
            {t('navigation.store')}
          </SidebarWithLargeItems.NavItem>
        </Link>
        <Link to="/app/billing">
          <SidebarWithLargeItems.NavItem
            selected={pathname.startsWith('/app/billing')}
            icon={<FeatherBarChart2 />}
          >
            {t('navigation.billing')}
          </SidebarWithLargeItems.NavItem>
        </Link>
      </SidebarWithLargeItems>

      {/* MOBILE OVERLAY DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 flex md:hidden">
          <div
            className="fixed inset-0 bg-overlay-background/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Content */}
          <div className="relative flex w-64 flex-col bg-default-background shadow-xl animate-in slide-in-from-left duration-200">
            <div className="p-4 pt-20 flex flex-col gap-2">
              <Link to="/app/dashboard">
                <SidebarWithLargeItems.NavItem
                  icon={<FeatherHome />}
                  selected={pathname === '/app/dashboard'}
                >
                  {t('navigation.home')}
                </SidebarWithLargeItems.NavItem>
              </Link>
              <Link to="/app/cases">
                <SidebarWithLargeItems.NavItem
                  icon={<FeatherInbox />}
                  selected={pathname.startsWith('/app/cases')}
                  rightSlot={
                    BadgeCount > 0 ? (
                      <Badge variant="error">{BadgeCount}</Badge>
                    ) : null
                  }
                >
                  {t('navigation.cases')}
                </SidebarWithLargeItems.NavItem>
              </Link>
              <Link to="/app/store">
                <SidebarWithLargeItems.NavItem
                  icon={<FeatherShoppingBag />}
                  selected={pathname.startsWith('/app/store')}
                  rightSlot={<Badge variant="brand">{t('common.new')}</Badge>}
                >
                  {t('navigation.store')}
                </SidebarWithLargeItems.NavItem>
              </Link>
              <Link to="/app/billing">
                <SidebarWithLargeItems.NavItem
                  icon={<FeatherBarChart2 />}
                  selected={pathname.startsWith('/app/billing')}
                >
                  {t('navigation.billing')}
                </SidebarWithLargeItems.NavItem>
              </Link>
              <Link to="/app/profile">
                <SidebarWithLargeItems.NavItem
                  icon={<FeatherUser />}
                  selected={pathname.startsWith('/app/profile')}
                >
                  {t('navigation.profile')}
                </SidebarWithLargeItems.NavItem>
              </Link>
              <Link to="/app/settings">
                <SidebarWithLargeItems.NavItem
                  icon={<FeatherSettings />}
                  selected={pathname.startsWith('/app/settings')}
                >
                  {t('navigation.settings')}
                </SidebarWithLargeItems.NavItem>
              </Link>

              <hr className="my-2 border-component-divider" />

              <button
                onClick={async () => {
                  await unregisterPush()
                  await supabase.auth.signOut();
                  navigate('/');
                }}
                className="flex items-center gap-2 p-3 text-error-color"
              >
                <SubframeCore.FeatherLogOut /> {t('navigation.signOut')}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" />

      {/* MAIN CONTENT */}


      
      {children ? (
        /*
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background w-full">
          {children}
        </div>
        */
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch bg-default-background w-full"> 
        {children}
      </div>
      ) : null}
    </div>
  );
});

export const DefaultPageLayout = DefaultPageLayoutRoot;
