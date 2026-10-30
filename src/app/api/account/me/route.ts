import { getAppDatabase } from "@/lib/db/app-db";
import { userFromRequest } from "@/lib/auth/session";

export async function GET(request: Request) {
  const database = await getAppDatabase();
  const user = await userFromRequest(database.db, request);
  return Response.json({ user });
}
