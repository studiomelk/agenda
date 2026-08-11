import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const projectId = "studio-5279929289-498c5";
const apiKey = "AIzaSyDpRvSlrfpynbpoCJItut1kfC7ePe9Ym6U";

type Payload = {
  type: "lead" | "proposal" | "contract";
  externalId: string;
  client?: { name?: string; email?: string; whatsapp?: string };
  event?: { title?: string; date?: string; time?: string; place?: string; mapsUrl?: string };
  commercial?: { service?: string; total?: number | string; installments?: number | string; dueDate?: string };
  contract?: { url?: string; signed?: boolean };
  source?: { channel?: string; url?: string; format?: string; title?: string };
};

function normalizedDate(value: unknown) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);
  if (!match) return text;
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2]}-${match[1]}`;
}

async function token() {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }), cache: "no-store",
  });
  const body = await response.json() as { idToken?: string };
  if (!response.ok || !body.idToken) throw new Error("Não foi possível autenticar a integração.");
  return body.idToken;
}

function encode(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  return { mapValue: { fields: fields(value as Record<string, unknown>) } };
}

function fields(data: Record<string, unknown>) { return Object.fromEntries(Object.entries(data).map(([key, item]) => [key, encode(item)])); }

function paymentSchedule(text: unknown, total: number, dueDate?: unknown) {
  const schedule = String(text || "").split("\n").map((line, index) => {
    const match = line.match(/(\d+)ª:\s*(\d{2}\/\d{2}\/(?:\d{2}|\d{4}))\s*—\s*R\$\s*([\d.,]+)/);
    if (!match) return null;
    const [day, month, rawYear] = match[2].split("/");
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    const value = Number(match[3].replace(/\./g, "").replace(",", ".")) || 0;
    return { id: `parcela-${index + 1}`, parcela: Number(match[1]), valor: value, status: "Pendente", vencimento: `${year}-${month}-${day}` };
  }).filter(Boolean);
  if (schedule.length) return schedule;
  return total ? [{ id: "parcela-1", parcela: 1, valor: total, status: "Pendente", vencimento: String(dueDate || "") }] : [];
}

async function write(collection: string, id: string, data: Record<string, unknown>, auth: string) {
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { authorization: `Bearer ${auth}`, "content-type": "application/json" }, body: JSON.stringify({ fields: fields({ id, ...data }) }), cache: "no-store",
  });
  if (!response.ok) throw new Error("O banco principal recusou a gravação.");
}

function decodeSetting(value: unknown) {
  const item = value as { stringValue?: string; booleanValue?: boolean } | undefined;
  return item?.stringValue ?? item?.booleanValue;
}

async function integrationSettings(auth: string) {
  const fallback = { pairCode: process.env.GERADOR_PAIR_CODE || "Melk21", enabled: true };
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/integration_settings/flow`, {
    headers: { authorization: `Bearer ${auth}` }, cache: "no-store",
  });
  if (response.status === 404) return fallback;
  const body = await response.json() as { fields?: Record<string, unknown> };
  if (!response.ok) return fallback;
  return {
    pairCode: String(decodeSetting(body.fields?.pairCode) || fallback.pairCode),
    enabled: decodeSetting(body.fields?.enabled) !== false,
  };
}

export async function POST(request: Request) {
  const expected = process.env.GERADOR_SYNC_SECRET;
  const auth = await token();
  const settings = await integrationSettings(auth);
  const internalAuthorized = Boolean(expected && request.headers.get("authorization") === `Bearer ${expected}`);
  const publicAuthorized = settings.enabled && request.headers.get("x-studio-pair-code") === settings.pairCode;
  if (!internalAuthorized && !publicAuthorized) return NextResponse.json({ error: "Integração não autorizada." }, { status: 401, headers: { "access-control-allow-origin": "*" } });
  const payload = await request.json().catch(() => null) as Payload | null;
  if (!payload?.type || !payload.externalId) return NextResponse.json({ error: "Envie type e externalId." }, { status: 400 });
  try {
    const clientId = `gerador-client-${payload.externalId}`;
    const eventId = `gerador-event-${payload.externalId}`;
    const total = Number(payload.commercial?.total || 0);
    const eventDate = normalizedDate(payload.event?.date);
    const payments = paymentSchedule(payload.commercial?.installments, total, payload.commercial?.dueDate);
    const requestData = {
      // Contratos já entram confirmados: cliente + evento + agenda são criados
      // no mesmo envio. Propostas e formulários permanecem no funil comercial.
      status: payload.type === "contract" ? "Contratado" : payload.type === "proposal" ? "Proposta enviada" : "Pendente", tipoEvento: payload.event?.title || "Evento",
      dadosContratante: { nome: payload.client?.name || "Cliente", email: payload.client?.email || "", whatsapp: payload.client?.whatsapp || "" },
      dadosEvento: { data: eventDate, horario: payload.event?.time || "", local: payload.event?.place || "" },
      dadosComerciais: { servico: payload.commercial?.service || "", valorTotal: total, parcelas: String(payload.commercial?.installments || "") }, criadoEm: new Date().toISOString(), externalId: payload.externalId, tipoRecebido: payload.type, origem: payload.source?.title || (payload.type === "contract" ? "Contrato do Studio Melk Flow" : payload.type === "proposal" ? "Proposta do Studio Melk Flow" : "Contato de site"), sourceUrl: payload.source?.url || "", sourceChannel: payload.source?.channel || "Studio Melk Flow", sourceFormat: payload.source?.format || "aplicativo",
    };
    await write("solicitacoes", `gerador-${payload.externalId}`, requestData, auth);
    if (payload.type === "contract") {
      await write("clientes", clientId, { integrationId: payload.externalId, nome: payload.client?.name || "Cliente", email: payload.client?.email || "", whatsapp: payload.client?.whatsapp || "", pagamentos: payments }, auth);
      await write("events", eventId, { integrationId: payload.externalId, title: payload.event?.title || "Evento", date: eventDate, time: payload.event?.time || "", locCerimonia: payload.event?.place || "", mapUrl: payload.event?.mapsUrl || "", clientId, services: payload.commercial?.service || "", status: "Confirmado", team: [], contractUrl: payload.contract?.url || "", contractSigned: Boolean(payload.contract?.signed) }, auth);
      await write("pedidos", `gerador-order-${payload.externalId}`, { integrationId: payload.externalId, clientId, solicitacaoId: `gerador-${payload.externalId}`, servicos: payload.commercial?.service || "", valorTotal: total, parcelas: payload.commercial?.installments || "", status: "Aberto", dadosEvento: requestData.dadosEvento, dataCriacao: new Date().toISOString() }, auth);
    }
    return NextResponse.json({ ok: true, imported: payload.type, externalId: payload.externalId, agendaCreated: payload.type === "contract", message: payload.type === "contract" ? "Contrato recebido: ficha, agenda e financeiro foram criados." : "Proposta recebida no funil comercial." }, { headers: { "access-control-allow-origin": "*" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao importar." }, { status: 502 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET, POST, PUT, OPTIONS", "access-control-allow-headers": "content-type, x-studio-pair-code", "access-control-max-age": "86400" } });
}

export async function GET(request: Request) {
  const pairCode = request.headers.get("x-studio-pair-code");
  const auth = await token();
  const settings = await integrationSettings(auth);
  if (!pairCode || pairCode !== settings.pairCode) return NextResponse.json({ connected: false, error: "Código de conexão inválido." }, { status: 401 });
  if (!settings.enabled) return NextResponse.json({ connected: false, disabled: true, error: "Integração desconectada." }, { status: 409 });
  if (!process.env.GERADOR_SYNC_SECRET) return NextResponse.json({ connected: false, error: "A chave interna da integração não está configurada." }, { status: 503 });
  return NextResponse.json({ connected: true, application: "Studio Melk Flow", sync: "ativa" }, { headers: { "cache-control": "no-store" } });
}

export async function PUT(request: Request) {
  const currentCode = request.headers.get("x-studio-pair-code");
  const auth = await token();
  const settings = await integrationSettings(auth);
  if (!currentCode || currentCode !== settings.pairCode) return NextResponse.json({ error: "Código atual inválido." }, { status: 401 });
  const body = await request.json().catch(() => null) as { pairCode?: string; enabled?: boolean } | null;
  const nextCode = String(body?.pairCode || settings.pairCode).trim();
  if (nextCode.length < 6) return NextResponse.json({ error: "Use um código com pelo menos 6 caracteres." }, { status: 400 });
  await write("integration_settings", "flow", { pairCode: nextCode, enabled: body?.enabled !== false, updatedAt: new Date().toISOString() }, auth);
  return NextResponse.json({ connected: body?.enabled !== false, pairCode: nextCode });
}
