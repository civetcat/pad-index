import { and, eq } from "drizzle-orm";
import { getAppDatabase } from "@/lib/db/app-db";
import { favorites } from "@/lib/db/schema";
import { userFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const database = await getAppDatabase();
  const user = await userFromRequest(database.db, request);
  if (!user) {
    return Response.json({ error: "未登入" }, { status: 401 });
  }
  const rows = await database.db
    .select({ monsterId: favorites.monsterId })
    .from(favorites)
    .where(eq(favorites.userId, user.id));
  return Response.json({ monsterIds: rows.map((row) => row.monsterId) });
}

export async function POST(request: Request) {
  const database = await getAppDatabase();
  const user = await userFromRequest(database.db, request);
  if (!user) {
    return Response.json({ error: "未登入" }, { status: 401 });
  }
  const body = (await request.json()) as { monsterId?: number; saved?: boolean };
  if (!Number.isInteger(body.monsterId)) {
    return Response.json({ error: "缺少怪物 ID" }, { status: 400 });
  }
  const monsterId = body.monsterId as number;
  if (body.saved === false) {
    await database.db
      .delete(favorites)
      .where(and(eq(favorites.userId, user.id), eq(favorites.monsterId, monsterId)));
  } else {
    await database.db
      .insert(favorites)
      .values({ userId: user.id, monsterId, createdAt: new Date().toISOString() })
      .onConflictDoNothing();
  }
  return Response.json({ ok: true });
}
