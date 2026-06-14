import { auth } from "@/auth";
import { Landing } from "./(landing)/Landing";

export default async function Root() {
  const session = await auth();

  const hasGoogle = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  const user = session?.user
    ? {
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        role: (session.user as { role?: string }).role ?? "student",
      }
    : null;

  return <Landing hasGoogle={hasGoogle} user={user} />;
}
