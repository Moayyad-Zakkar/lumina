/*
 * Documentation:
 * Bold navbar — https://app.subframe.com/3c939b2b64b7/library?component=Bold+navbar_672f6b33-51f9-41a4-9929-d0570d10efe6
 * Link Button — https://app.subframe.com/3c939b2b64b7/library?component=Link+Button_a4ee726a-774c-4091-8c49-55b659356024
 * Button — https://app.subframe.com/3c939b2b64b7/library?component=Button_3b777358-b86b-40af-9327-891efc6826fe
 */

import React from 'react';
import * as SubframeUtils from '../utils';
import { LinkButton } from './LinkButton';
import { Button } from './Button';
import { Link, NavLink } from 'react-router';

interface NavItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  selected?: boolean;
  className?: string;
}

const NavItem = React.forwardRef<HTMLElement, NavItemProps>(function NavItem(
  { children, selected = false, className, ...otherProps }: NavItemProps,
  ref
) {
  return (
    <div
      className={SubframeUtils.twClassNames(
        'group/8596eb9f flex h-8 cursor-pointer flex-col items-center justify-center gap-4 rounded-full px-4',
        { 'bg-brand-200': selected },
        className
      )}
      ref={ref as any}
      {...otherProps}
    >
      {children ? (
        <span className="font-['Montserrat'] text-[15px] font-[600] leading-[20px] text-brand-900">
          {children}
        </span>
      ) : null}
    </div>
  );
});

interface BoldNavbarRootProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const BoldNavbarRoot = React.forwardRef<HTMLElement, BoldNavbarRootProps>(
  function BoldNavbarRoot(
    { className, ...otherProps }: BoldNavbarRootProps,
    ref
  ) {
    return (
      <div
        className={SubframeUtils.twClassNames(
          'flex w-full max-w-[1280px] flex-wrap items-center gap-4',
          className
        )}
        ref={ref as any}
        {...otherProps}
      >
        <div className="flex h-12 flex-col items-start justify-center gap-2 px-4">
          <img
            className="h-6 flex-none object-cover"
            src="https://res.cloudinary.com/subframe/image/upload/v1751625200/uploads/16759/jpef3z487npyabdeeipn.png"
          />
        </div>
        <div className="flex min-w-[320px] grow shrink-0 basis-0 flex-wrap items-center gap-1">
          <NavLink to="/">
            <NavItem selected={true}>Home</NavItem>
          </NavLink>
          <NavLink to="/features">
            <NavItem>Features</NavItem>
          </NavLink>
          <NavLink to="/about">
            <NavItem>About</NavItem>
          </NavLink>
        </div>
        <LinkButton>Pricing</LinkButton>
        <LinkButton>Contact</LinkButton>
        <div className="flex items-center gap-2 px-2">
          <Link to="/login">
            <Button variant="brand-tertiary">Log in</Button>
          </Link>
          {/*
          <Link to="/register">
            <Button>Sign up</Button>
          </Link>
            */}
        </div>
      </div>
    );
  }
);

export const BoldNavbar = Object.assign(BoldNavbarRoot, {
  NavItem,
});
