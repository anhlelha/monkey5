import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// ADMIN_EMAILS env var is a fallback; primary source of truth is UserWhitelist table.
const adminEmailsEnv = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// Built-in demo accounts for local testing without OAuth setup.
// Each click signs into the same stable account so progress persists.
export const DEMO_ACCOUNTS = {
  admin: { email: "admin-demo@local", name: "Admin Demo", role: "admin" },
  student: { email: "user-demo@local", name: "Khỉ con (Demo)", role: "student" },
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/signin",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      id: "demo",
      name: "Demo",
      credentials: {
        role: { label: "Role", type: "text" },
      },
      authorize: async (creds) => {
        const role = String(creds?.role ?? "") as DemoRole;
        const account = DEMO_ACCOUNTS[role];
        if (!account) return null;

        const user = await prisma.user.upsert({
          where: { email: account.email },
          create: { email: account.email, name: account.name, role: account.role },
          update: { name: account.name, role: account.role },
        });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return true;
      const email = user.email.toLowerCase();

      // Look up whitelist entry for this email
      const whitelist = await prisma.userWhitelist.findUnique({ where: { email } });

      // Determine role: whitelist > env admin list > default "student"
      const role = whitelist?.role ?? (adminEmailsEnv.includes(email) || email === "admin-demo@local" ? "admin" : "student");
      const plan = whitelist?.plan ?? "free";

      // Apply role + plan to User record (upsert safe — user might not exist yet on first OAuth)
      await prisma.user.updateMany({
        where: { email },
        data: { role, plan },
      });

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const email = user.email.toLowerCase();

        // Fetch whitelist configuration
        const whitelist = await prisma.userWhitelist.findUnique({ where: { email } });
        const targetRole = whitelist?.role ?? (adminEmailsEnv.includes(email) || email === "admin-demo@local" ? "admin" : "student");
        const targetPlan = whitelist?.plan ?? "free";

        // Query database record
        let dbUser = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true, plan: true },
        });

        if (dbUser) {
          // Force synchronization if database record is out of sync with whitelist
          if (dbUser.role !== targetRole || dbUser.plan !== targetPlan) {
            dbUser = await prisma.user.update({
              where: { id: dbUser.id },
              data: { role: targetRole, plan: targetPlan },
              select: { id: true, role: true, plan: true },
            });
          }
          token.userId = dbUser.id;
          token.role = dbUser.role;
          token.plan = dbUser.plan;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
        session.user.role = (token.role as string) ?? "student";
        session.user.plan = (token.plan as string) ?? "free";
      }
      return session;
    },
  },
});
