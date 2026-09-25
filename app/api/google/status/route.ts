import { NextResponse } from "next/server";
import { loadGoogleTokens } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tokens = await loadGoogleTokens();
    if (!tokens || (!tokens.access_token && !tokens.refresh_token)) {
      return NextResponse.json({ connected: false });
    }
    return NextResponse.json({
      connected: true,
      email: tokens.email || null,
      updated_at: tokens.updated_at,
    });
  } catch (err) {
    return NextResponse.json(
      { connected: false, error: err instanceof Error ? err.message : "Erro ao verificar status" },
      { status: 500 }
    );
  }
}
