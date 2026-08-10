import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { readStagingRequests } from "../../../../lib/firestore-staging";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const expected = process.env.MANAGER_ACCESS_PASSWORD;
  const received = request.headers.get("x-manager-access");
  if (!expected || !received) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ error: "Acesso privado necessário." }, { status: 401 });
  try {
    const result = await readStagingRequests();
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ configured: true, records: [], error: error instanceof Error ? error.message : "Falha ao ler dados." }, { status: 502 });
  }
}
