import { NextResponse } from "next/server";
import {
  refreshAccessTokenIfNeeded,
  buildEventTitle,
  buildEventDescription,
  type EventDetailsInput,
} from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const accessToken = await refreshAccessTokenIfNeeded();
    const calendarId = process.env.GOOGLE_CALENDAR_ID || "primary";

    const body = await request.json().catch(() => ({})) as EventDetailsInput & {
      isTestEvent?: boolean;
      startDate?: string; // YYYY-MM-DD
      startTime?: string; // HH:mm
      durationMinutes?: number;
    };

    let startIso: string;
    let endIso: string;
    const timeZone = "America/Sao_Paulo";
    let summary: string;
    let description: string;
    let location: string;

    if (body.isTestEvent) {
      summary = "TESTE — STUDIO MELK GESTÃO";
      description = "Evento de teste de integração gerado automaticamente pelo Studio Melk Gestão.";
      location = "Estúdio Melk Foto e Filme";
      const now = new Date();
      const end = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins
      startIso = now.toISOString();
      endIso = end.toISOString();
    } else {
      summary = buildEventTitle(body.noiva, body.noivo);
      description = buildEventDescription(body);
      location = body.endereco || body.local || "";

      let eventDate = body.dataEvento || body.startDate;
      // Convert DD/MM/YYYY to YYYY-MM-DD if needed
      if (eventDate && /^\d{2}\/\d{2}\/\d{4}$/.test(eventDate)) {
        const [d, m, y] = eventDate.split("/");
        eventDate = `${y}-${m}-${d}`;
      }

      const eventTime = body.horario || body.startTime || "16:00";
      const validTime = /^\d{2}:\d{2}$/.test(eventTime) ? eventTime : "16:00";

      if (eventDate && /^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
        const startDateTimeStr = `${eventDate}T${validTime}:00-03:00`;
        const startDateObj = new Date(startDateTimeStr);
        const durationHours = body.durationMinutes ? body.durationMinutes / 60 : 8;
        const endDateObj = new Date(startDateObj.getTime() + durationHours * 60 * 60 * 1000);
        startIso = startDateObj.toISOString();
        endIso = endDateObj.toISOString();
      } else {
        // Fallback to current time tomorrow
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const end = new Date(tomorrow.getTime() + 8 * 60 * 60 * 1000);
        startIso = tomorrow.toISOString();
        endIso = end.toISOString();
      }
    }

    const payload = {
      summary,
      description,
      location,
      start: { dateTime: startIso, timeZone },
      end: { dateTime: endIso, timeZone },
    };

    const googleRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      }
    );

    const resData = await googleRes.json() as { id?: string; htmlLink?: string; error?: { message?: string } };

    if (!googleRes.ok || !resData.id) {
      return NextResponse.json(
        { ok: false, error: resData.error?.message || "Falha ao criar evento no Google Calendar" },
        { status: googleRes.status }
      );
    }

    return NextResponse.json({
      ok: true,
      google_event_id: resData.id,
      htmlLink: resData.htmlLink,
      message: "Evento criado no Google Calendar com sucesso!",
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro ao criar evento" },
      { status: 500 }
    );
  }
}
