import React, { useEffect, useState } from 'react';
import * as SubframeUtils from '../utils';
import { SidebarWithLargeItems } from '../components/SidebarWithLargeItems';
import {
  FeatherHome,
  FeatherUsers,
  FeatherInbox,
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
  const { t } = useTranslation();
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();

  const [BadgeCount, setBadgeCount] = useState(initialBadgeCount ?? 0);
  const [badgeLoading, setBadgeLoading] = useState(true);
  const [signupRequestCount, setSignupRequestCount] = useState(0);
  const [signupRequestLoading, setSignupRequestLoading] = useState(true);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Notifications logic (existing)
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

  // Signup Requests logic (existing)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const cacheKey = 'signup_request_count';
      const cached = localStorage.getItem(cacheKey);
      if (isMounted && cached != null) setSignupRequestCount(Number(cached));
      const { count, error } = await supabase
        .from('signup_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (!error && isMounted) {
        setSignupRequestCount(count || 0);
        localStorage.setItem(cacheKey, String(count || 0));
      }
      if (isMounted) setSignupRequestLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Realtime Subscriptions (existing logic omitted for brevity, keep yours as is)

  return (
    <div
      className={SubframeUtils.twClassNames(
        'flex h-screen w-full flex-col md:flex-row items-center',
        className
      )}
      ref={ref as any}
    >
      {/* MOBILE HEADER - Sticky Option 2 */}
      <div className="flex md:hidden sticky top-0 w-full items-center justify-between px-4 py-3 border-b border-component-divider bg-default-background z-30">
        <img className="h-8" src="/logo.png" alt="logo" />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-subtext-color"
        >
          {isMobileMenuOpen ? <FeatherX /> : <FeatherMenu />}
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <SidebarWithLargeItems
        className="hidden md:flex"
        header={<img className="flex-none" src="/logo.png" />}
        footer={
          <SubframeCore.DropdownMenu.Root>
            <SubframeCore.DropdownMenu.Trigger asChild>
              <div className="cursor-pointer">
                <Avatar
                  image="/favicon.png"
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
                    icon={<FeatherSettings />}
                    onClick={() => navigate('/admin/settings')}
                  >
                    {t('navigation.settings')}
                  </SidebarWithLargeItems.NavItem>
                  <SidebarWithLargeItems.NavItem
                    icon={<SubframeCore.FeatherLogOut />}
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate('/');
                    }}
                  >
                    {t('navigation.signOut')}
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
            {t('navigation.home')}
          </SidebarWithLargeItems.NavItem>
        </Link>
        <Link to="/admin/doctors">
          <SidebarWithLargeItems.NavItem
            icon={<FeatherUsers />}
            selected={pathname.startsWith('/admin/doctors')}
          >
            {t('navigation.doctors')}
          </SidebarWithLargeItems.NavItem>
        </Link>
        <Link to="/admin/cases">
          <SidebarWithLargeItems.NavItem
            icon={<FeatherInbox />}
            selected={pathname.startsWith('/admin/cases')}
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
        <Link to="/admin/signup-requests">
          <SidebarWithLargeItems.NavItem
            icon={<FeatherUser />}
            selected={pathname.startsWith('/admin/signup-requests')}
            rightSlot={
              signupRequestCount > 0 ? (
                <Badge
                  variant="error"
                  className="ml-2 px-2 py-0 text-xs rounded-full"
                >
                  {signupRequestCount}
                </Badge>
              ) : null
            }
          >
            {t('navigation.signUpRequests')}
          </SidebarWithLargeItems.NavItem>
        </Link>
        <Link to="/admin/billing">
          <SidebarWithLargeItems.NavItem
            selected={pathname.startsWith('/admin/billing')}
            icon={<FeatherBarChart2 />}
          >
            {t('navigation.billing')}
          </SidebarWithLargeItems.NavItem>
        </Link>
      </SidebarWithLargeItems>

      {/* MOBILE OVERLAY DRAWER */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-20 flex md:hidden">
          <div
            className="fixed inset-0 bg-overlay-background/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex w-64 flex-col bg-default-background shadow-xl animate-in slide-in-from-left duration-200">
            <div className="p-4 pt-20 flex flex-col gap-2">
              <Link to="/admin/dashboard">
                <SidebarWithLargeItems.NavItem
                  icon={<FeatherHome />}
                  selected={pathname === '/admin/dashboard'}
                >
                  {t('navigation.home')}
                </SidebarWithLargeItems.NavItem>
              </Link>
              <Link to="/admin/doctors">
                <SidebarWithLargeItems.NavItem
                  icon={<FeatherUsers />}
                  selected={pathname.startsWith('/admin/doctors')}
                >
                  {t('navigation.doctors')}
                </SidebarWithLargeItems.NavItem>
              </Link>
              <Link to="/admin/cases">
                <SidebarWithLargeItems.NavItem
                  icon={<FeatherInbox />}
                  selected={pathname.startsWith('/admin/cases')}
                  rightSlot={
                    BadgeCount > 0 ? (
                      <Badge variant="error">{BadgeCount}</Badge>
                    ) : null
                  }
                >
                  {t('navigation.cases')}
                </SidebarWithLargeItems.NavItem>
              </Link>
              <Link to="/admin/signup-requests">
                <SidebarWithLargeItems.NavItem
                  icon={<FeatherUser />}
                  selected={pathname.startsWith('/admin/signup-requests')}
                  rightSlot={
                    signupRequestCount > 0 ? (
                      <Badge variant="error">{signupRequestCount}</Badge>
                    ) : null
                  }
                >
                  {t('navigation.signUpRequests')}
                </SidebarWithLargeItems.NavItem>
              </Link>
              <Link to="/admin/billing">
                <SidebarWithLargeItems.NavItem
                  icon={<FeatherBarChart2 />}
                  selected={pathname.startsWith('/admin/billing')}
                >
                  {t('navigation.billing')}
                </SidebarWithLargeItems.NavItem>
              </Link>
              <Link to="/admin/settings">
                <SidebarWithLargeItems.NavItem
                  icon={<FeatherSettings />}
                  selected={pathname.startsWith('/admin/settings')}
                >
                  {t('navigation.settings')}
                </SidebarWithLargeItems.NavItem>
              </Link>

              <hr className="my-2 border-component-divider" />

              <button
                onClick={async () => {
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

      {/* MAIN CONTENT AREA */}
      {children ? (
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch overflow-y-auto bg-default-background w-full">
          {children}
        </div>
      ) : null}
    </div>
  );
});

export const DefaultPageLayout = DefaultPageLayoutRoot;
