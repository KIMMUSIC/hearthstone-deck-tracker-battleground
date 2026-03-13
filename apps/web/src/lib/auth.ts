import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      battleTag: string;
      battleNetId: string;
    };
  }

  interface User {
    battleTag?: string;
    battleNetId?: string;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    {
      id: 'battlenet',
      name: 'Battle.net',
      type: 'oauth',
      authorization: {
        url: 'https://oauth.battle.net/authorize',
        params: { scope: 'openid' },
      },
      token: 'https://oauth.battle.net/token',
      userinfo: 'https://oauth.battle.net/userinfo',
      clientId: process.env.BATTLENET_CLIENT_ID,
      clientSecret: process.env.BATTLENET_CLIENT_SECRET,
      profile(profile) {
        return {
          id: String(profile.sub),
          battleTag: profile.battletag as string,
          battleNetId: String(profile.sub),
        };
      },
    },
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.battleTag = user.battleTag;
        token.battleNetId = user.battleNetId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.battleTag = (token.battleTag as string) ?? '';
      session.user.battleNetId = (token.battleNetId as string) ?? '';
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
