import { Fragment, type CSSProperties } from "react";

export type IconName =
  | "home" | "library" | "plus" | "target" | "grid" | "chat" | "admin" | "clock"
  | "check" | "x" | "flag" | "arrow" | "back" | "bolt" | "book" | "sparkle"
  | "search" | "settings" | "user" | "upload" | "download" | "eye"
  | "chevR" | "chevL" | "star" | "more" | "fire" | "trend" | "pause" | "send"
  | "school" | "refresh" | "filter" | "lock" | "pencil" | "eraser" | "trash" | "undo";

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  style?: CSSProperties;
  className?: string;
}

const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-7H9v7H4a1 1 0 01-1-1v-9z" />,
  library: <Fragment><path d="M4 4h4v16H4z" /><path d="M10 4h4v16h-4z" /><path d="M16 5l3 1-3 14-3-1z" /></Fragment>,
  plus: <Fragment><path d="M12 5v14" /><path d="M5 12h14" /></Fragment>,
  target: <Fragment><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></Fragment>,
  grid: <Fragment><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Fragment>,
  chat: <path d="M21 12a8 8 0 11-3.4-6.55L21 4l-1.3 3.6A7.97 7.97 0 0121 12zM8 11h.01M12 11h.01M16 11h.01" />,
  admin: <Fragment><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0114 0" /></Fragment>,
  clock: <Fragment><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Fragment>,
  check: <path d="M5 12l5 5L20 7" />,
  x: <Fragment><path d="M6 6l12 12" /><path d="M18 6L6 18" /></Fragment>,
  flag: <Fragment><path d="M5 21V4" /><path d="M5 4h12l-2 4 2 4H5" /></Fragment>,
  arrow: <Fragment><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></Fragment>,
  back: <Fragment><path d="M19 12H5" /><path d="M11 6l-6 6 6 6" /></Fragment>,
  bolt: <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
  book: <Fragment><path d="M4 4h6a4 4 0 014 4v12a4 4 0 00-4-4H4z" /><path d="M20 4h-6a4 4 0 00-4 4v12a4 4 0 014-4h6z" /></Fragment>,
  sparkle: <Fragment><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2 2M16.4 16.4l2 2M5.6 18.4l2-2M16.4 7.6l2-2" /></Fragment>,
  search: <Fragment><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Fragment>,
  settings: <Fragment><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></Fragment>,
  user: <Fragment><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0116 0" /></Fragment>,
  upload: <Fragment><path d="M12 16V4" /><path d="M6 10l6-6 6 6" /><path d="M4 20h16" /></Fragment>,
  download: <Fragment><path d="M12 4v12" /><path d="M6 10l6 6 6-6" /><path d="M4 20h16" /></Fragment>,
  eye: <Fragment><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></Fragment>,
  chevR: <path d="M9 6l6 6-6 6" />,
  chevL: <path d="M15 6l-6 6 6 6" />,
  star: <path d="M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.6L12 18l-5.9 3.1 1.2-6.6L2.5 9.9 9.1 9z" />,
  more: <Fragment><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></Fragment>,
  fire: <path d="M12 3s-1 4-3 6-3 4-3 7a6 6 0 0012 0c0-3-2-5-3-7 1 2 0 4-2 4 0-3-1-7-1-10z" />,
  trend: <Fragment><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></Fragment>,
  pause: <Fragment><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></Fragment>,
  send: <Fragment><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" /></Fragment>,
  school: <Fragment><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v6c0 1 3 3 6 3s6-2 6-3v-6" /></Fragment>,
  refresh: <Fragment><path d="M3 12a9 9 0 0115-6.7L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 01-15 6.7L3 16" /><path d="M3 21v-5h5" /></Fragment>,
  filter: <path d="M3 5h18l-7 9v6l-4-2v-4z" />,
  lock: <Fragment><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></Fragment>,
  pencil: <Fragment><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4z" /></Fragment>,
  eraser: <Fragment><path d="M20 13l-7.5 7.5a2 2 0 01-3 0L5 16a2 2 0 010-3l7-7 7 7" /><path d="M14 8l6 6" /></Fragment>,
  trash: <Fragment><path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" /></Fragment>,
  undo: <Fragment><path d="M3 7v6h6" /><path d="M21 17a9 9 0 00-15-6.7L3 13" /></Fragment>,
};

export function Icon({ name, size = 16, stroke = 1.5, style, className }: IconProps) {
  return (
    <svg
      className={"ico" + (className ? " " + className : "")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {PATHS[name]}
    </svg>
  );
}
