import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from '../lib/router';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'ghost';
type Common = { variant?: Variant; icon?: IconName; size?: 'md' | 'sm'; children: ReactNode; className?: string; cursorLabel?: string };

function classes(variant: Variant, size: 'md' | 'sm', extra?: string) {
  return ['btn', 'gloss-btn', variant === 'ghost' && 'btn-ghost', size === 'sm' && 'btn-sm', extra].filter(Boolean).join(' ');
}

function Inner({ icon, children }: { icon?: IconName; children: ReactNode }) {
  return (
    <span className="btn-label" data-magnetic-inner>
      {icon && <Icon name={icon} />}
      {children}
    </span>
  );
}

/** Magnetic, glossy link-button. */
export function ButtonLink({ to, variant = 'primary', icon, size = 'md', children, className, cursorLabel }: Common & { to: string }) {
  return (
    <Link to={to} className={classes(variant, size, className)} data-magnetic="0.35" data-cursor={cursorLabel}>
      <Inner icon={icon}>{children}</Inner>
    </Link>
  );
}

export function Button({ variant = 'primary', icon, size = 'md', children, className, cursorLabel, ...rest }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classes(variant, size, className)} data-magnetic="0.3" data-cursor={cursorLabel} {...rest}>
      <Inner icon={icon}>{children}</Inner>
    </button>
  );
}
