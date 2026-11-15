import React from 'react';
import { Link } from 'react-router';
import { FeatherChevronRight } from '@subframe/core';

// The RoleCard pattern from RoleSelect, with an icon element instead of an image.
export default function ActionCard({
  to,
  title,
  subtitle,
  icon,
  cardClassName,
  subtitleClassName = 'text-subtext-color',
  badge = null,
}) {
  return (
    <Link
      to={to}
      className={`flex w-full items-center gap-4 rounded-[28px] px-5 py-4 shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99] ${cardClassName}`}
    >
      <div className="flex h-16 w-16 flex-none items-center justify-center rounded-full bg-white/70 text-brand-600">
        {icon}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="w-full text-xl font-bold text-brand-600">{title}</span>
        <span className={`w-full text-body ${subtitleClassName}`}>{subtitle}</span>
      </div>
      {badge}
      <FeatherChevronRight className="h-5 w-5 flex-none text-neutral-400 rtl:rotate-180" />
    </Link>
  );
}