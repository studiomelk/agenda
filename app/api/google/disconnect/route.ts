import { NextResponse } from "next/server";
import { deleteGoogleTokens } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    await deleteGoogleTokens();
    return NextResponse.json({ ok: true, message: "Conta Google desconectada com sucesso." });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao desconectar conta Google." },
      { status: 500 }
    );
  }
}
