import type { CSSProperties } from 'react';
import { Link } from 'react-router';

import type { MagnetBoardItem } from './MagnetBoard';
import boardStyles from './MagnetBoard.module.css';
import styles from './InlineMagnet.module.css';

export function InlineMagnet({ item }: { item: MagnetBoardItem }) {
  const customProperties = {
    '--magnet-tilt': '0deg',
    ...(item.iconUrl ? { '--magnet-icon': `url("${item.iconUrl}")` } : {}),
  } as CSSProperties;
  const classes = [
    boardStyles.magnet,
    boardStyles[item.tone ?? 'quiet'],
    boardStyles[item.kind ?? 'default'],
    item.detail ? boardStyles.hasDetail : '',
    item.active || item.selected ? boardStyles.active : '',
    styles.inline,
  ].filter(Boolean).join(' ');
  const content = (
    <>
      {item.icon ? <span className={boardStyles.icon} aria-hidden="true">{item.icon}</span> : null}
      <span className={boardStyles.label}>
        {item.label}
        {item.detail ? <span className={boardStyles.detail}>{item.detail}</span> : null}
      </span>
      {item.badge ? <span className={boardStyles.badge}>{item.badge}</span> : null}
      {typeof item.count === 'number' ? <span className={boardStyles.count}>{item.count}</span> : null}
    </>
  );

  if (item.to) {
    return (
      <Link
        to={item.to}
        className={classes}
        style={customProperties}
        data-magnet-id={item.id}
        aria-label={item.ariaLabel}
        aria-current={item.active ? 'page' : undefined}
        aria-expanded={item.ariaExpanded}
        aria-haspopup={item.ariaHasPopup}
        aria-controls={item.ariaControls}
        draggable={false}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      style={customProperties}
      data-magnet-id={item.id}
      aria-label={item.ariaLabel}
      aria-pressed={item.selected !== undefined ? item.selected : undefined}
      aria-expanded={item.ariaExpanded}
      aria-haspopup={item.ariaHasPopup}
      aria-controls={item.ariaControls}
      onClick={item.onActivate}
    >
      {content}
    </button>
  );
}
