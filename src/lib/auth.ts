import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export type UserRecord = { id: string; username: string; displayName: string; passwordHash: string; role: string; createdAt: string };
const cookieName = "valen_session";
const secret = process.env.SESSION_SECRET;
export { cookieName };
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}
export function verifyPassword(password: string, stored: string) {
  try {
    const [salt, expected] = stored.split(":");
    const actual = scryptSync(password, salt, 64);
    const expectedBuffer = Buffer.from(expected, "hex");
    return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
  } catch { return false; }
}
function sign(payload: string) {
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET harus diatur minimal 32 karakter.");
  return createHmac("sha256", secret).update(payload).digest("base64url");
}
export function createSession(user: Pick<UserRecord, "id" | "username" | "role">) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function readSession(token?: string) {
  try {
    if (!token) return null;
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = Buffer.from(sign(payload));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return { id: String(data.id), username: String(data.username), role: String(data.role) };
  } catch { return null; }
}
export function cookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 7 };
}
