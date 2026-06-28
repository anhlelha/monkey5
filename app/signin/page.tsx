import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SignInForm } from "./SignInForm";

interface Props {
  searchParams: Promise<{ callbackUrl?: string; error?: string; disabled?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const session = await auth();
  const { callbackUrl, error, disabled } = await searchParams;
  const isDisabledNotice = disabled === "1";

  // Only redirect if the session points to a user that still exists AND is not
  // disabled. The "?disabled=1" notice must always render the form, never
  // bounce back into the app.
  if (session?.user?.id && !isDisabledNotice) {
    const existing = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, disabled: true },
    });
    if (existing && !existing.disabled) redirect(callbackUrl ?? "/overview");
  }

  const hasGoogle = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return (
    <SignInForm
      callbackUrl={callbackUrl ?? "/overview"}
      hasGoogle={hasGoogle}
      error={error}
      disabledNotice={isDisabledNotice}
    />
  );
}
