import { NextResponse } from "next/server";
import {
  refreshAccessTokenIfNeeded,
  buildEventTitle,
  buildEventDescription,
  type EventDetailsInput,
} from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const accessToken = await refreshAccessTokenIfNeeded();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    const body = await request.json().catch(() => ({})) as EventDetailsInput & {
      google_event_id?: string;
      startDate?: string;
      startTime?: string;
    };

    const googleEventId = body.google_event_id;
    if (!googleEventId) {
      return NextResponse.json({ ok: false, error: "google_event_id é obrigatório para atualização." }, { status: 400 });
    }

    const summary = buildEventTitle(body.noiva, body.noivo);
    const description = buildEventDescription(body);
    const location = body.endereco || body.local || "";
    const timeZone = "America/Sao_Paulo";

    let eventDate = body.dataEvento || body.startDate;
    if (eventDate && /^\d{2}\/\d{2}\/\d{4}$/.test(eventDate)) {
      const [d, m, y] = eventDate.split("/");
      eventDate = `${y}-${m}-${d}`;
    }
    const eventTime = body.horario || body.startTime || "16:00";
    const validTime = /^\d{2}:\d{2}$/.test(eventTime) ? eventTime : "16:00";

    let startIso: string;
    let endIso: string;

    if (eventDate && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
      const startDateTimeStr = `${eventDate}T${validTime}:00-03:00`;
      const startDateObj = new Date(startDateTimeStr);
      const endDateObj = new Date(startDateObj.getTime() + 8 * 60 * 60 * 1000);
      startIso = startDateObj.toISOString();
      endIso = endDateObj.toISOString();
    } else {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const end = new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000);
      startIso = tomorrow.toISOString();
      endIso = end.toISOString();
    }

    const payload = {
      summary,
      description,
      location,
      start: { dateTime: startIso, timeZone },
      end: { dateTime: endIso, timeZone },
    };

    const googleRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(googleEventId)}`,
      {
        method: "PUT",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const resData = await googleRes.json() as { id?: string; htmlLink?: string; error?: { message?: string } };

    if (!googleRes.ok) {
      return NextResponse.json(
        { ok: false, error: resData.error?.message || "Falha ao atualizar evento no Google Calendar" },
        { status: googleRes.status }
      );
    }

    return NextResponse.json({
      ok: true,
      google_event_id: resData.id,
      htmlLink: resData.htmlLink,
      message: "Evento atualizado no Google Calendar com sucesso!",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro ao atualizar evento" },
      { status: 500 }
    );
  }
}
