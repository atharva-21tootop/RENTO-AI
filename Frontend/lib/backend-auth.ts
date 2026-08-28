import type { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { auth } from "@/auth";
import { getToken } from "next-auth/jwt";

function b64url(data: string | Buffer): string {
  return Buffer.from(data).toString("base64url");
}

// Plain HS256 JWT signed with the shared AUTH_SECRET — the format the backend's
// get_current_user() verifies (app/core/auth.py).
function signHs256(payload: Record<string, unknown>, secret: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const body = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

/**
 * Bearer token for backend calls. Prefers the FastAPI-issued access token
 * stored on the session (see auth.ts jwt/session callbacks).
 *
 * Legacy sessions — signed before backend tokens were attached to the JWT, or
 * Google sign-ins where the backend link call briefly failed — have no backend
 * token. The NextAuth cookie can't be passed through directly: Auth.js v5
 * stores it as an encrypted JWE, which the backend's HS256 verifier can't
 * read. So decrypt the session payload and re-sign it as a plain HS256 JWT.
 *
 * ponytail: the re-sign path is a compatibility shim for old sessions; drop it
 * once every session is re-issued after the migration (a re-login attaches a
 * backend token and this function never reaches the fallback).
 */
export async function getBackendAuthToken(req: NextRequest): Promise<string | null> {
  const session = await auth();
  if (session?.accessToken) return session.accessToken;

  const jwt = await getToken({ req, secret: process.env.AUTH_SECRET });
  if (!jwt?.sub) return null;
  const now = Math.floor(Date.now() / 1000);
  const exp = typeof jwt.exp === "number" ? jwt.exp : now + 60 * 60 * 24 * 30;
  return signHs256(
    {
      sub: jwt.sub,
      email: jwt.email,
      name: jwt.name,
      role: jwt.role || "phc_staff",
      phcId: jwt.phcId,
      provider: jwt.provider || "credentials",
      iat: now,
      exp,
    },
    process.env.AUTH_SECRET!,
  );
}