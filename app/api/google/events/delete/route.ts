import { NextResponse } from "next/server";
import { refreshAccessTokenIfNeeded } from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const accessToken = await refreshAccessTokenIfNeeded();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    const url = new URL(request.url);
    let eventId = url.searchParams.get("google_event_id");

    if (!eventId) {
      const body = await request.json().catch(() => ({})) as { google_event_id?: string };
      eventId = body.google_event_id || null;
    }

    if (!eventId) {
      return NextResponse.json({ ok: false, error: "google_event_id é obrigatório para exclusão." }, { status: 400 });
    }

    const googleRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: "DELETE",
        headers: { authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      }
    );

    if (!googleRes.ok && googleRes.status !== 404 && googleRes.status !== 410) {
      const errBody = await googleRes.json().catch(() => ({}));
      return NextResponse.json(
        { ok: false, error: errBody.error?.message || `Falha ao excluir evento (${googleRes.status})` },
        { status: googleRes.status }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Evento removido do Google Calendar com sucesso!",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro ao excluir evento" },
      { status: 500 }
    );
  }
}
