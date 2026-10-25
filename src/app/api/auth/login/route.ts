import { NextResponse } from "next/server";
import { findUser } from "@/lib/github-users";
import { createSession, cookieOptions, verifyPassword } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!username || !password) return NextResponse.json({ error: "Isi username dan password." }, { status: 400 });
    const user = await findUser(username);
    if (!user || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
    const response = NextResponse.json({ user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role, expiresAt: user.expiresAt ?? null } });
    response.cookies.set("valen_session", createSession(user), cookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Login gagal." }, { status: 500 });
  }
}
