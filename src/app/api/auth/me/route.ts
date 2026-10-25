import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { cookieName, readSession } from "@/lib/auth";
export async function GET() {
  const token = (await cookies()).get(cookieName)?.value;
  const user = readSession(token);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user });
}
