import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { loginSchema } from '@/lib/validations';
import { authConfig } from '@/auth.config';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000';

type BackendUser = {
  id: string;
  name: string;
  email: string;
  provider: string;
  role: string;
  phc_id: string | null;
  is_verified: boolean;
};

async function backendRequest(path: string, body: unknown): Promise<{
  access_token: string;
  user: BackendUser;
}> {
  const res = await fetch(`${BACKEND}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(typeof json.detail === 'string' ? json.detail : 'Authentication failed');
  }
  return json;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const validatedFields = loginSchema.safeParse(credentials);
        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        // Credential login is validated entirely by the backend (single source of truth).
        // The thrown message (e.g. "Please verify your email address before logging in.")
        // is surfaced by the login form, matching the previous behavior.
        const { access_token, user } = await backendRequest('/api/auth/login', {
          email,
          password,
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: '',
          provider: user.provider,
          role: user.role,
          phcId: user.phc_id || undefined,
          accessToken: access_token,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn() {
      // No DB writes here anymore: Google accounts are upserted by the backend
      // (POST /api/auth/oauth/google) on first login in the jwt callback.
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        const usr = user as {
          id?: string;
          email?: string;
          provider?: string;
          phcId?: string;
          role?: string;
          accessToken?: string;
        };
        token.provider = usr.provider || account?.provider || 'credentials';
        token.phcId = usr.phcId;
        token.role = usr.role || 'phc_staff';
        token.accessToken = usr.accessToken;

        if (account?.provider === 'google') {
          // Resolve/link the Google account via the backend so the session gets a
          // valid token + phcId without touching the database directly.
          try {
            const { access_token, user: bu } = await backendRequest('/api/auth/oauth/google', {
              google_id: (account as { providerAccountId?: string }).providerAccountId || token.email,
              email: token.email,
              name: typeof token.name === 'string' ? token.name : undefined,
            });
            token.accessToken = access_token;
            token.id = bu.id;
            token.provider = bu.provider;
            token.role = bu.role;
            token.phcId = bu.phc_id || undefined;
          } catch (e) {
            console.error('Error linking Google account via backend:', e);
          }
        } else {
          token.id = usr.id || usr.email || '';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.provider = (token.provider as string) || 'credentials';
        session.user.role = (token.role as string) || 'phc_staff';
        session.user.phcId = token.phcId as string | undefined;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});
