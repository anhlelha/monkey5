import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Landing } from "./(landing)/Landing";

export default async function Root() {
  const session = await auth();
  if (session?.user?.id) redirect("/home");

  const hasGoogle = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );

  return <Landing hasGoogle={hasGoogle} />;
}
