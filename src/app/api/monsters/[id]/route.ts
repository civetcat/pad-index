import { getAppDatabase } from "@/lib/db/app-db";
import { getMonster } from "@/lib/queries/monsters";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!/^\d+$/.test(id)) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }
  const database = await getAppDatabase();
  const detail = await getMonster(database.db, Number(id));
  if (!detail) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json({
    monsterId: detail.monster.monsterId,
    name: detail.monster.name,
    nameEn: detail.monster.nameEn,
    nameCht: detail.monster.nameCht,
    atkMax: detail.monster.atkMax,
    activeCooldown: detail.activeSkill?.initialCooldown ?? null,
    leaderName: detail.leaderSkill?.name ?? null,
  });
}
