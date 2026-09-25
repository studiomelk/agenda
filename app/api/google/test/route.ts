import { NextResponse } from "next/server";
import { refreshAccessTokenIfNeeded, loadGoogleTokens } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accessToken = await refreshAccessTokenIfNeeded();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`, {
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return NextResponse.json(
        { ok: false, error: errBody.error?.message || `Falha na API do Google Calendar (${res.status})` },
        { status: res.status }
      );
    }

    const data = await res.json() as { summary?: string; timeZone?: string };
    const tokens = await loadGoogleTokens();

    return NextResponse.json({
      ok: true,
      summary: data.summary,
      timeZone: data.timeZone,
      email: tokens?.email || null,
      message: "Conexão com o Google Calendar testada com sucesso!",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro ao testar conexão" },
      { status: 500 }
    );
  }
}
