import type { ReactNode } from 'react';

import styles from './DisclosureRow.module.css';

type DisclosureRowProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  variant?: 'row' | 'card' | 'section';
  className?: string;
  bodyClassName?: string;
  defaultOpen?: boolean;
};

export function DisclosureRow({
  title,
  description,
  children,
  variant = 'row',
  className = '',
  bodyClassName = '',
  defaultOpen = false,
}: DisclosureRowProps) {
  return (
    <details className={`${styles.root} ${styles[variant]} ${className}`.trim()} open={defaultOpen || undefined}>
      <summary>
        <span><strong>{title}</strong>{description ? <small>{description}</small> : null}</span>
        <span aria-hidden="true">›</span>
      </summary>
      <div className={`${styles.body} ${bodyClassName}`.trim()}>{children}</div>
    </details>
  );
}
