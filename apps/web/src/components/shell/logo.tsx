export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="14" fill="#135434" />
      <path d="M10 42c8-14 36-14 44 0" stroke="#f48c1f" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M16 42v8M48 42v8M32 34v16" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <circle cx="22" cy="20" r="5" fill="#fff" />
      <circle cx="42" cy="20" r="5" fill="#fff" />
      <path d="M22 26l10 6 10-6" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
