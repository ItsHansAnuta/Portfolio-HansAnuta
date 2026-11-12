export default function Icon({ name = 'arrow', size = 20, ...props }) {
  const paths = {
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    external: <path d="M7 17 17 7M7 7h10v10" />,
    web: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 9h18M7 6.5h.01M10 6.5h.01m-1 6-3 2 3 2m6-4 3 2-3 2" /></>,
    desktop: <><rect x="3" y="3" width="18" height="13" rx="2" /><path d="M8 21h8m-4-5v5M7 7h6m-6 4h10" /></>,
    mobile: <><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10 5h4m-3 14h2" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 6 9 7 9-7" /></>,
    github: <path d="M9 19c-5 1-5-3-7-3m14 5v-4a3.5 3.5 0 0 0-1-2.5c3-.3 6-1.5 6-6A4.7 4.7 0 0 0 20 5c.1-1 0-2-.5-3 0 0-1.2-.4-4 1.5a14 14 0 0 0-7 0C5.7 1.6 4.5 2 4.5 2 4 3 3.9 4 4 5a4.7 4.7 0 0 0-1 3.5c0 4.5 3 5.7 6 6A3.5 3.5 0 0 0 8 17v4" />,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.arrow}</svg>;
}
