type InventoryMarkProps = {
  count: number;
  className?: string;
};

export function InventoryMark({ count, className }: InventoryMarkProps) {
  const displayCount = count > 999 ? '999+' : String(count);

  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M10.8 3.5c1.5 1 3.2 1.5 5.2 1.5s3.7-.5 5.2-1.5l-1.7 5h-7l-1.7-5Z" fill="color-mix(in srgb, var(--primary) 28%, var(--surface-raised) 72%)" />
      <path d="M12.5 8.5c-3 3.4-6 7.3-6 12.6 0 5 3.5 7.4 9.5 7.4s9.5-2.4 9.5-7.4c0-5.3-3-9.2-6-12.6h-7Z" fill="var(--primary)" />
      <path d="M10.7 8.5h10.6" />
      <text x="16" y="24" fill="var(--primary-fg)" stroke="none" textAnchor="middle" fontSize={displayCount.length > 2 ? 6.5 : 9} fontWeight="800">{displayCount}</text>
    </svg>
  );
}
