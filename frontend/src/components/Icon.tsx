type IconName =
  | 'arrow-down' | 'arrow-up' | 'swap' | 'plus' | 'send' | 'qr'
  | 'copy' | 'eye' | 'eye-off' | 'chevron-right' | 'chevron-left'
  | 'shield' | 'lock' | 'bell' | 'gift' | 'book' | 'history'
  | 'settings' | 'wallet' | 'check' | 'x' | 'search' | 'user' | 'logout';

const ICONS: Record<IconName, string> = {
  'arrow-down': 'M12 4v16m0 0l-7-7m7 7l7-7',
  'arrow-up':   'M12 20V4m0 0l-7 7m7-7l7 7',
  'swap':       'M7 16V8m0 0l-3 3m3-3l3 3M17 8v8m0 0l3-3m-3 3l-3-3',
  'plus':       'M12 5v14m-7-7h14',
  'send':       'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  'qr':         'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM18 18h3v3h-3zM14 18h3v3h-3zM18 14h3v3h-3z',
  'copy':       'M8 4h12v12M16 8H4v12h12V8z',
  'eye':        'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z',
  'eye-off':    'M2 2l20 20M10.6 10.6a3 3 0 004.2 4.2M17.5 17.5C16 18.4 14 19 12 19c-6.5 0-10-7-10-7s1.6-3 4.5-5.1M9 5.5C10 5.2 11 5 12 5c6.5 0 10 7 10 7s-1 1.8-2.5 3.5',
  'chevron-right': 'M9 6l6 6-6 6',
  'chevron-left':  'M15 6l-6 6 6 6',
  'shield':     'M12 2l8 4v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6l8-4z',
  'lock':       'M5 11h14v10H5zM7 11V7a5 5 0 0110 0v4',
  'bell':       'M6 8a6 6 0 0112 0c0 7 3 9 3 9H3s3-2 3-9zM10 21a2 2 0 004 0',
  'gift':       'M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z',
  'book':       'M4 19.5A2.5 2.5 0 016.5 17H20V2H6.5A2.5 2.5 0 004 4.5v15zM4 19.5V22h16',
  'history':    'M3 12a9 9 0 109-9 9 9 0 00-7 3.3M3 4v5h5M12 7v5l3 3',
  'settings':   'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  'wallet':     'M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M16 12h5v4h-5a2 2 0 010-4z',
  'check':      'M5 12l5 5L20 7',
  'x':          'M18 6L6 18M6 6l12 12',
  'search':     'M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4.3-4.3',
  'user':       'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  'logout':     'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
};

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color ?? 'currentColor'}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={ICONS[name]} />
    </svg>
  );
}
