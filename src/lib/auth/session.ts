import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { sessions, users } from "@/lib/db/schema";

const cookieName = "pad_session";
const thirtyDays = 30 * 24 * 60 * 60 * 1000;

export async function createSession(db: LibSQLDatabase, userId: number) {
  const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + thirtyDays).toISOString();
  await db.insert(sessions).values({ tokenHash, userId, expiresAt });
  return { token, expiresAt };
}

export async function userFromRequest(db: LibSQLDatabase, request: Request) {
  const token = readCookie(request, cookieName);
  if (!token) {
    return null;
  }
  const tokenHash = await sha256(token);
  const rows = await db
    .select({
      id: users.id,
      username: users.username,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.tokenHash, tokenHash))
    .limit(1);
  const row = rows[0];
  if (!row || row.expiresAt < new Date().toISOString()) {
    return null;
  }
  return { id: row.id, username: row.username };
}

export function sessionCookie(token: string, request: Request, expiresAt: string) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${cookieName}=${token}; HttpOnly; SameSite=Lax; Path=/; Expires=${new Date(expiresAt).toUTCString()}${secure}`;
}

export function clearSessionCookie() {
  return `${cookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function deleteSession(db: LibSQLDatabase, request: Request) {
  const token = readCookie(request, cookieName);
  if (!token) {
    return;
  }
  await db.delete(sessions).where(eq(sessions.tokenHash, await sha256(token)));
}

function readCookie(request: Request, name: string) {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      return rest.join("=");
    }
  }
  return undefined;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

function bytesToHex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
