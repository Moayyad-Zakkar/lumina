'use client';
/*
 * Documentation:
 * Dropdown Menu — https://app.subframe.com/3c939b2b64b7/library?component=Dropdown+Menu_99951515-459b-4286-919e-a89e7549b43b
 */

import React from 'react';
import * as SubframeUtils from '../utils';
import * as SubframeCore from '@subframe/core';
import { FeatherStar } from '@subframe/core';

interface DropdownItemProps
  extends React.ComponentProps<typeof SubframeCore.DropdownMenu.Item> {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const DropdownItem = React.forwardRef<HTMLElement, DropdownItemProps>(
  function DropdownItem(
    {
      children,
      icon = <FeatherStar />,
      className,
      ...otherProps
    }: DropdownItemProps,
    ref
  ) {
    return (
      <SubframeCore.DropdownMenu.Item asChild={true} {...otherProps}>
        <div
          className={SubframeUtils.twClassNames(
            // FIX: Add flex-row-reverse to visually place the icon on the right
            'group/adcae8d6 flex flex-row-reverse h-8 w-full cursor-pointer items-center gap-2 rounded-md px-3 hover:bg-neutral-100 active:bg-neutral-50 data-[highlighted]:bg-neutral-100',
            className
          )}
          ref={ref as any}
        >
          {icon ? (
            <SubframeCore.IconWrapper className="text-body font-body text-default-font">
              {icon}
            </SubframeCore.IconWrapper>
          ) : null}

          {children ? (
            <span
              // The dir="rtl" on the parent (DropdownMenuRoot) handles text alignment
              className="line-clamp-1 grow shrink-0 basis-0 text-body font-body text-default-font group-hover/adcae8d6:text-default-font"
            >
              {children}
            </span>
          ) : null}
        </div>
      </SubframeCore.DropdownMenu.Item>
    );
  }
);

interface DropdownDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const DropdownDivider = React.forwardRef<HTMLElement, DropdownDividerProps>(
  function DropdownDivider(
    { className, ...otherProps }: DropdownDividerProps,
    ref
  ) {
    return (
      <div
        className={SubframeUtils.twClassNames(
          'flex w-full items-start gap-2 px-1 py-1',
          className
        )}
        ref={ref as any}
        {...otherProps}
      >
        <div className="flex h-px grow shrink-0 basis-0 flex-col items-center gap-2 bg-neutral-200" />
      </div>
    );
  }
);

interface DropdownMenuRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  // FIX: Add dir property to allow external control of directionality
  dir?: 'ltr' | 'rtl';
}

const DropdownMenuRoot = React.forwardRef<HTMLElement, DropdownMenuRootProps>(
  function DropdownMenuRoot(
    { children, className, dir, ...otherProps }: DropdownMenuRootProps,
    ref
  ) {
    return children ? (
      <div
        className={SubframeUtils.twClassNames(
          'flex min-w-[192px] flex-col items-start rounded-md border border-solid border-neutral-border bg-default-background px-1 py-1 shadow-lg',
          className
        )}
        ref={ref as any}
        dir={dir} // FIX: Pass the dir property to the root DOM element
        {...otherProps}
      >
        {children}
      </div>
    ) : null;
  }
);

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  DropdownItem,
  DropdownDivider,
});
