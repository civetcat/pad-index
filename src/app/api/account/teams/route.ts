import { eq } from "drizzle-orm";
import { getAppDatabase } from "@/lib/db/app-db";
import { savedTeams } from "@/lib/db/schema";
import { userFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const database = await getAppDatabase();
  const user = await userFromRequest(database.db, request);
  if (!user) {
    return Response.json({ error: "未登入" }, { status: 401 });
  }
  const rows = await database.db
    .select()
    .from(savedTeams)
    .where(eq(savedTeams.userId, user.id));
  return Response.json({ teams: rows });
}

export async function POST(request: Request) {
  const database = await getAppDatabase();
  const user = await userFromRequest(database.db, request);
  if (!user) {
    return Response.json({ error: "未登入" }, { status: 401 });
  }
  const body = (await request.json()) as { name?: string; monsterIds?: number[] };
  const ids = (body.monsterIds ?? []).filter((id) => Number.isInteger(id)).slice(0, 6);
  if (!body.name?.trim() || ids.length === 0) {
    return Response.json({ error: "需要隊伍名稱與至少一隻怪物" }, { status: 400 });
  }
  await database.db.insert(savedTeams).values({
    userId: user.id,
    name: body.name.trim().slice(0, 40),
    monsterIdsJson: JSON.stringify(ids),
    updatedAt: new Date().toISOString(),
  });
  return Response.json({ ok: true });
}
