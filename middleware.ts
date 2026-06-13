import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_EXACT = ["/"];
const PUBLIC_PREFIX = [
  "/signin",
  "/api/auth",
  "/_next",
  "/favicon.ico",
  "/landing.css",
  "/landing.js",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (PUBLIC_EXACT.includes(pathname)) return;
  if (PUBLIC_PREFIX.some((p) => pathname.startsWith(p))) return;

  const session = req.auth;
  if (!session?.user?.id) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/create")) {
    if (session.user?.role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/home";
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
