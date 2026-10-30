export async function adminAuthorized(request: Request) {
  const expected = await readAdminSecret();
  if (!expected) {
    return false;
  }
  return request.headers.get("authorization") === `Bearer ${expected}`;
}

export async function readAdminSecret() {
  if (process.env.ADMIN_SECRET) {
    return process.env.ADMIN_SECRET;
  }
  try {
    const { env } = await import("cloudflare:workers");
    return env.ADMIN_SECRET;
  } catch {
    return undefined;
  }
}

export async function adminUnavailableResponse() {
  if (await readAdminSecret()) {
    return null;
  }
  return Response.json(
    { error: "ADMIN_SECRET 尚未設定，管理操作已關閉" },
    { status: 503 },
  );
}

export function unauthorizedResponse() {
  return Response.json({ error: "未授權" }, { status: 401 });
}
