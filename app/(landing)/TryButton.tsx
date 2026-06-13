"use client";

import { signIn } from "next-auth/react";
import type { ReactNode } from "react";

type Plan = "free" | "pro" | "vip" | "demo";

interface Props {
  plan?: Plan;
  className?: string;
  children: ReactNode;
  hasGoogle: boolean;
}

export function TryButton({ plan = "free", className, children, hasGoogle }: Props) {
  const onClick = () => {
    if (hasGoogle) {
      void signIn("google", { callbackUrl: "/home" });
    } else {
      window.location.href = "/signin?callbackUrl=/home";
    }
  };
  return (
    <button type="button" className={className} onClick={onClick} data-plan={plan}>
      {children}
    </button>
  );
}
