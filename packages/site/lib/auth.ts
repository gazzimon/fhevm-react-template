import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Facebook from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { Magic } from "@magic-sdk/admin";

const magic = new Magic(process.env.MAGIC_SECRET_KEY!);

const baseProviders: any[] = [
  Credentials({
    id: "magic-otp",
    name: "Email OTP",
    credentials: { didToken: { label: "DID", type: "text" } },
    async authorize(creds) {
      const did = creds?.didToken;
      if (!did) return null;
      await magic.token.validate(did);
      const meta = await magic.users.getMetadataByToken(did);
      if (!meta.email) return null;

      const user = await prisma.user.upsert({
        where: { email: meta.email },
        update: {},
        create: { email: meta.email, name: meta.issuer ?? null },
      });

      return { id: user.id, email: user.email ?? undefined, name: user.name ?? undefined };
    },
  }),
];

// Habilita OAuth solo si tienes credenciales:
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  baseProviders.push(Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }));
}
if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  baseProviders.push(GitHub({ clientId: process.env.GITHUB_ID, clientSecret: process.env.GITHUB_SECRET }));
}
if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  baseProviders.push(Facebook({ clientId: process.env.FACEBOOK_CLIENT_ID, clientSecret: process.env.FACEBOOK_CLIENT_SECRET }));
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },         // liviano para MVP
  providers: baseProviders,
  pages: { signIn: "/auth/login" },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) (session.user as any).id = token.sub;
      return session;
    },
  },
};
