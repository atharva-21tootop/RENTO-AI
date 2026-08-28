import { NextRequest, NextResponse } from "next/server";
import { getBackendAuthToken } from "@/lib/backend-auth";

// Return the FastAPI-issued access token from the session (auth.ts), falling
// back to the raw NextAuth cookie for legacy sessions lacking a backend token.
// See lib/backend-auth.ts.
export async function GET(req: NextRequest) {
  return NextResponse.json({ token: await getBackendAuthToken(req) });
}