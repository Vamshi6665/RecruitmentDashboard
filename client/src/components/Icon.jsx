// Custom inline SVG icon set (16px grid, 1.5px stroke). <Icon name="chart" />
const PATHS = {
  logo: <path d="M3 12.5V6l5-3 5 3v6.5M6 12.5V9h4v3.5" />,
  briefcase: <><rect x="2" y="4.5" width="12" height="9" rx="1.5" /><path d="M5.5 4.5V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1.5M2 8.5h12" /></>,
  people: <><circle cx="6" cy="5.5" r="2.5" /><path d="M1.5 13.5c.5-2.5 2.3-3.8 4.5-3.8s4 1.3 4.5 3.8M11 3.2a2.4 2.4 0 0 1 0 4.6M12.5 9.9c1.1.5 1.8 1.6 2 3.6" /></>,
  chart: <path d="M2 13.5h12M4 11V7M7 11V3.5M10 11V6M13 11V8.5" />,
  user: <><circle cx="8" cy="5.5" r="2.8" /><path d="M2.5 14c.7-2.9 2.8-4.3 5.5-4.3s4.8 1.4 5.5 4.3" /></>,
  funnel: <path d="M2 3h12l-4.5 5.5V13l-3 1.5V8.5z" />,
  settings: <><circle cx="8" cy="8" r="2.2" /><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" /></>,
  search: <><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5 14 14" /></>,
  close: <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />,
  command: <path d="M5.5 5.5h5v5h-5zM5.5 5.5V4A1.5 1.5 0 1 0 4 5.5h1.5zM10.5 5.5V4A1.5 1.5 0 1 1 12 5.5h-1.5zM5.5 10.5V12A1.5 1.5 0 1 1 4 10.5h1.5zM10.5 10.5V12a1.5 1.5 0 1 0 1.5-1.5h-1.5z" />,
  calendar: <><rect x="2" y="3" width="12" height="11" rx="1.5" /><path d="M2 6.5h12M5 1.5v3M11 1.5v3" /></>,
  database: <><ellipse cx="8" cy="3.8" rx="5.5" ry="2" /><path d="M2.5 3.8v8.4c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V3.8M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" /></>,
  sun: <><circle cx="8" cy="8" r="3" /><path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1" /></>,
  moon: <path d="M13.5 9.8A5.8 5.8 0 0 1 6.2 2.5a5.8 5.8 0 1 0 7.3 7.3z" />,
  reset: <path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5v3h3" />,
  arrow: <path d="M3 8h10M9 4l4 4-4 4" />,
}

export function Icon({ name, size = 16, className = '', title }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {PATHS[name]}
    </svg>
  )
}
