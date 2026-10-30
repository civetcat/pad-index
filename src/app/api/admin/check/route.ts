import { getAppDatabase } from "@/lib/db/app-db";
import {
  adminAuthorized,
  adminUnavailableResponse,
  unauthorizedResponse,
} from "@/lib/admin/auth";
import { checkUpstream } from "@/lib/upstream/check";

export async function POST(request: Request) {
  const unavailable = await adminUnavailableResponse();
  if (unavailable) {
    return unavailable;
  }
  if (!(await adminAuthorized(request))) {
    return unauthorizedResponse();
  }
  const database = await getAppDatabase();
  const result = await checkUpstream(database.db);
  return Response.json(result);
}
