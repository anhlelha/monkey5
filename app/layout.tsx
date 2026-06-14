import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import "./globals.css";
import "katex/dist/katex.min.css";

const VALID_THEMES = new Set(["clay", "ocean", "forest", "grape", "coral"]);

async function resolveTheme(): Promise<string> {
  try {
    const session = await auth();
    if (!session?.user?.id) return "clay";
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true },
    });
    const t = u?.theme ?? "clay";
    return VALID_THEMES.has(t) ? t : "clay";
  } catch {
    return "clay";
  }
}

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cùng Khỉ con vào lớp 6 CLC",
  description:
    "Luyện đề, đánh giá lộ trình và học cùng AI — dành cho học sinh lớp 5 thi vào trường chất lượng cao.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const theme = await resolveTheme();
  return (
    <html
      lang="vi"
      className={`${beVietnam.variable} ${jetbrains.variable}`}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
