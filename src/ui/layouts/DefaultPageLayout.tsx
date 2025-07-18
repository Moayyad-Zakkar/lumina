"use client";
/*
 * Documentation:
 * Default Page Layout — https://app.subframe.com/3c939b2b64b7/library?component=Default+Page+Layout_a57b1c43-310a-493f-b807-8cc88e2452cf
 * Sidebar with large items — https://app.subframe.com/3c939b2b64b7/library?component=Sidebar+with+large+items_70c3656e-47c2-460e-8007-e198804e8862
 * Dropdown Menu — https://app.subframe.com/3c939b2b64b7/library?component=Dropdown+Menu_99951515-459b-4286-919e-a89e7549b43b
 * Avatar — https://app.subframe.com/3c939b2b64b7/library?component=Avatar_bec25ae6-5010-4485-b46b-cf79e3943ab2
 */

import React from "react";
import * as SubframeUtils from "../utils";
import { SidebarWithLargeItems } from "../components/SidebarWithLargeItems";
import { FeatherHome } from "@subframe/core";
import { FeatherBell } from "@subframe/core";
import { FeatherInbox } from "@subframe/core";
import { FeatherBarChart2 } from "@subframe/core";
import { FeatherUser } from "@subframe/core";
import { FeatherSettings } from "@subframe/core";
import { DropdownMenu } from "../components/DropdownMenu";
import * as SubframeCore from "@subframe/core";
import { FeatherMoreHorizontal } from "@subframe/core";
import { Avatar } from "../components/Avatar";

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
  return (
    <div
      className={SubframeUtils.twClassNames(
        "flex h-screen w-full items-center",
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
          <Avatar image="https://res.cloudinary.com/subframe/image/upload/v1711417507/shared/fychrij7dzl8wgq2zjq9.avif">
            A
          </Avatar>
        }
      >
        <SidebarWithLargeItems.NavItem icon={<FeatherHome />} selected={true}>
          Home
        </SidebarWithLargeItems.NavItem>
        <SidebarWithLargeItems.NavItem icon={<FeatherBell />}>
          Notifications
        </SidebarWithLargeItems.NavItem>
        <SidebarWithLargeItems.NavItem icon={<FeatherInbox />}>
          Cases
        </SidebarWithLargeItems.NavItem>
        <SidebarWithLargeItems.NavItem icon={<FeatherBarChart2 />}>
          Reports
        </SidebarWithLargeItems.NavItem>
        <SubframeCore.DropdownMenu.Root>
          <SubframeCore.DropdownMenu.Trigger asChild={true}>
            <SidebarWithLargeItems.NavItem icon={<FeatherMoreHorizontal />}>
              More
            </SidebarWithLargeItems.NavItem>
          </SubframeCore.DropdownMenu.Trigger>
          <SubframeCore.DropdownMenu.Portal>
            <SubframeCore.DropdownMenu.Content
              side="right"
              align="end"
              sideOffset={4}
              asChild={true}
            >
              <DropdownMenu>
                <SidebarWithLargeItems.NavItem icon={<FeatherUser />}>
                  Profile
                </SidebarWithLargeItems.NavItem>
                <SidebarWithLargeItems.NavItem icon={<FeatherSettings />}>
                  Settings
                </SidebarWithLargeItems.NavItem>
              </DropdownMenu>
            </SubframeCore.DropdownMenu.Content>
          </SubframeCore.DropdownMenu.Portal>
        </SubframeCore.DropdownMenu.Root>
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
