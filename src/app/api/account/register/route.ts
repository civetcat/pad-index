import { getAppDatabase } from "@/lib/db/app-db";
import { users } from "@/lib/db/schema";
import { hashPassword, validPassword, validUsername } from "@/lib/auth/password";
import { createSession, sessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string; password?: string };
  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  if (!validUsername(username) || !validPassword(password)) {
    return Response.json(
      { error: "帳號需為 3-24 位英數，密碼至少 8 字" },
      { status: 400 },
    );
  }
  const database = await getAppDatabase();
  const secret = await hashPassword(password);
  try {
    const inserted = await database.db
      .insert(users)
      .values({
        username,
        passwordHash: secret.hash,
        passwordSalt: secret.salt,
        createdAt: new Date().toISOString(),
      })
      .returning({ id: users.id });
    const userId = inserted[0]?.id;
    if (!userId) {
      return Response.json({ error: "無法建立帳號" }, { status: 500 });
    }
    const session = await createSession(database.db, userId);
    return Response.json(
      { username },
      { headers: { "Set-Cookie": sessionCookie(session.token, request, session.expiresAt) } },
    );
  } catch {
    return Response.json({ error: "帳號已存在或無法建立" }, { status: 409 });
  }
}
