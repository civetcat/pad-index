import { getAppDatabase } from "@/lib/db/app-db";
import { clearSessionCookie, deleteSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  const database = await getAppDatabase();
  await deleteSession(database.db, request);
  return Response.json({ ok: true }, { headers: { "Set-Cookie": clearSessionCookie() } });
}
