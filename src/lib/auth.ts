import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      // Allow sign in if user exists or is being created
      if (account?.provider === "google") {
        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        return {
          ...token,
          id: user.id,
          role: dbUser?.role || "user",
          accessToken: account.access_token,
        };
      }

      // On subsequent requests, verify user still exists in database
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, role: true },
        });

        // If user no longer exists (deleted), clear the user data from token
        if (!dbUser) {
          // Remove user-specific data to invalidate the session
          delete token.id;
          delete token.role;
          return token;
        }

        // Update role from DB (for role changes to take effect)
        token.role = dbUser.role;
      } else if (token.email) {
        // Try to find user by email if id is missing
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
        // If user doesn't exist by email, token stays without id
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Set user id - empty string if user was deleted (token.id is undefined)
        session.user.id = (token.id as string) || "";
        session.user.role = (token.role as string) || "";
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  events: {
    async createUser({ user }) {
      // Log when a new user is created
      console.log("New user created:", user.email);
      // Mark user as needing onboarding by setting a flag
      // The user will be redirected to onboarding page
    },
    async signIn({ user }) {
      // Update last accessed time on sign in and create access log
      if (user.id) {
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { lastAccessedAt: new Date() },
          }),
          prisma.accessLog.create({
            data: {
              userId: user.id,
              action: "login",
            },
          }),
        ]);
      }
    },
  },
});

// Helper to check if user needs onboarding
export async function needsOnboarding(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  if (!user) return false;

  // Check if name is null or empty - name is required
  const nameNeedsUpdate = !user.name || user.name.trim() === "";

  return nameNeedsUpdate;
}
