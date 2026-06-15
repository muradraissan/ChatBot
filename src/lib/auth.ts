import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "ali@iraqrasael.test" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          workspaceId: user.workspaceId,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.workspaceId = user.workspaceId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
};

import { cookies } from "next/headers";

export const getAuthSession = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("next-auth.session-token")?.value || cookieStore.get("__Secure-next-auth.session-token")?.value;
  
  if (!token) return null;
  
  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true }
  });
  
  if (!session || session.expires < new Date()) return null;
  
  return { user: session.user };
};
