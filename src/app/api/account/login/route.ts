import { eq } from "drizzle-orm";
import { getAppDatabase } from "@/lib/db/app-db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, sessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  const username = body.username?.trim() ?? "";
  const database = await getAppDatabase();
  const rows = await database.db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  const user = rows[0];
  if (!user || !(await verifyPassword(body.password ?? "", user.passwordHash, user.passwordSalt))) {
    return Response.json({ error: "帳號或密碼不正確" }, { status: 401 });
  }
  const session = await createSession(database.db, user.id);
  return Response.json(
    { username: user.username },
    { headers: { "Set-Cookie": sessionCookie(session.token, request, session.expiresAt) } },
  );
}
