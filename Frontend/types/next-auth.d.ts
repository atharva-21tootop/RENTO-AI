import { DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      provider: string;
      phcId?: string;
      role?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    provider?: string;
    phcId?: string;
    role?: string;
    accessToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id?: string;
    provider?: string;
    phcId?: string;
    role?: string;
    accessToken?: string;
  }
}
