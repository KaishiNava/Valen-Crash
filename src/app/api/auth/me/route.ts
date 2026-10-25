import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cookieName, readSession } from "@/lib/auth";
import { findUser } from "@/lib/github-users";

export const runtime = "nodejs";

export async function GET() {
  const token = (await cookies()).get(cookieName)?.value;
  const sessionUser = readSession(token);
  if (!sessionUser) return NextResponse.json({ user: null }, { status: 401 });

  // Read the current account record so role/expiry changes in the GitHub JSON
  // database are reflected without relying on stale role data in an old cookie.
  try {
    const record = await findUser(sessionUser.username);
    if (!record) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({ user: {
      id: record.id,
      username: record.username,
      displayName: record.displayName,
      role: record.role,
      expiresAt: record.expiresAt ?? null
    } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Gagal memuat akun." }, { status: 503 });
  }
}
