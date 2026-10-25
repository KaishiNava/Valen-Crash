import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { addUser } from "@/lib/github-users";
import { createSession, cookieOptions, hashPassword } from "@/lib/auth";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim().toLowerCase();
    const displayName = String(body.displayName || username).trim().slice(0, 32);
    const password = String(body.password || "");
    if (!/^[a-z0-9_]{3,24}$/.test(username)) return NextResponse.json({ error: "Username 3–24 karakter: huruf kecil, angka, atau underscore." }, { status: 400 });
    if (password.length < 8 || password.length > 128) return NextResponse.json({ error: "Password harus 8–128 karakter." }, { status: 400 });
    const user = { id: randomUUID(), username, displayName: displayName || username, passwordHash: hashPassword(password), role: "user", createdAt: new Date().toISOString() };
    const session = createSession(user);
    const created = await addUser(user);
    if (!created) return NextResponse.json({ error: "Username sudah digunakan." }, { status: 409 });
    const response = NextResponse.json({ user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role } });
    response.cookies.set("valen_session", session, cookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Register gagal." }, { status: 500 });
  }
}
