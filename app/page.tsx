import { auth } from "@/auth";
import { getLandingTheme, getQuietHours } from "@/lib/app-settings";
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

  const [theme, quietHours] = await Promise.all([
    getLandingTheme(),
    getQuietHours(),
  ]);

  return <Landing hasGoogle={hasGoogle} user={user} theme={theme} quietHours={quietHours} />;
}
