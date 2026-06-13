import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SignInForm } from "./SignInForm";

interface Props {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;

  // Only redirect if the session points to a user that still exists in DB.
  // Stale cookies from a previous run / db:reset fall through to the form
  // (next sign-in writes a fresh cookie that overwrites the stale one).
  if (session?.user?.id) {
    const exists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (exists) redirect(callbackUrl ?? "/home");
  }

  const hasGoogle = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return <SignInForm callbackUrl={callbackUrl ?? "/home"} hasGoogle={hasGoogle} error={error} />;
}
