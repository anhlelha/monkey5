"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

interface BackButtonProps {
  /** Fallback URL when there is no in-app history to go back to. */
  fallback: string;
  label?: string;
}

export function BackButton({ fallback, label = "Quay lại" }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    const sameOriginReferrer =
      typeof document !== "undefined" &&
      document.referrer &&
      document.referrer.startsWith(window.location.origin);
    if (sameOriginReferrer && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button type="button" className="btn ghost" onClick={handleClick}>
      <Icon name="back" size={14} /> {label}
    </button>
  );
}
