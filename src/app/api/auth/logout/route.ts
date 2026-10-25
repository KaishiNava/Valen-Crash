import { NextResponse } from "next/server";
import { cookieOptions } from "@/lib/auth";
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("valen_session", "", { ...cookieOptions(), maxAge: 0 });
  return response;
}
