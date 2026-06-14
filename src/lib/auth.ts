import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    // Definiremos a página customizada de login nas próximas etapas
    signIn: "/login", 
  },
  callbacks: {
    async jwt({ token, user }) {
      // Se for o momento do login, injeta os dados do banco no token
      if (user) {
        token.id = user.id;
        token.companyId = user.companyId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Repassa os dados do token para a sessão ativa no Frontend
      if (session.user && token) {
        session.user.id = token.id;
        session.user.companyId = token.companyId;
        session.user.role = token.role;
      }
      return session;
    },
  },
};