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
};

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

async function write(collection: string, id: string, data: Record<string, unknown>, auth: string) {
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { authorization: `Bearer ${auth}`, "content-type": "application/json" }, body: JSON.stringify({ fields: fields({ id, ...data }) }), cache: "no-store",
  });
  if (!response.ok) throw new Error("O banco principal recusou a gravação.");
}

export async function POST(request: Request) {
  const expected = process.env.GERADOR_SYNC_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) return NextResponse.json({ error: "Integração não autorizada." }, { status: 401 });
  const payload = await request.json().catch(() => null) as Payload | null;
  if (!payload?.type || !payload.externalId) return NextResponse.json({ error: "Envie type e externalId." }, { status: 400 });
  try {
    const auth = await token();
    const clientId = `gerador-client-${payload.externalId}`;
    const eventId = `gerador-event-${payload.externalId}`;
    const total = Number(payload.commercial?.total || 0);
    const requestData = {
      // Contratos já entram confirmados: cliente + evento + agenda são criados
      // no mesmo envio. Propostas e formulários permanecem no funil comercial.
      status: payload.type === "contract" ? "Contratado" : "Pendente", tipoEvento: payload.event?.title || "Evento",
      dadosContratante: { nome: payload.client?.name || "Cliente", email: payload.client?.email || "", whatsapp: payload.client?.whatsapp || "" },
      dadosEvento: { data: payload.event?.date || "", horario: payload.event?.time || "", local: payload.event?.place || "" },
      dadosComerciais: { servico: payload.commercial?.service || "", valorTotal: total, parcelas: String(payload.commercial?.installments || "") }, criadoEm: new Date().toISOString(), externalId: payload.externalId, tipoRecebido: payload.type, origem: payload.type === "contract" ? "Contrato do Studio Melk Flow" : payload.type === "proposal" ? "Proposta do Studio Melk Flow" : "Contato de site",
    };
    await write("solicitacoes", `gerador-${payload.externalId}`, requestData, auth);
    if (payload.type === "contract") {
      await write("clientes", clientId, { integrationId: payload.externalId, nome: payload.client?.name || "Cliente", email: payload.client?.email || "", whatsapp: payload.client?.whatsapp || "", pagamentos: total ? [{ id: `entrada-${payload.externalId}`, parcela: 1, valor: total, status: "Pendente", vencimento: payload.commercial?.dueDate || "" }] : [] }, auth);
      await write("events", eventId, { integrationId: payload.externalId, title: payload.event?.title || "Evento", date: payload.event?.date || "", time: payload.event?.time || "", locCerimonia: payload.event?.place || "", mapUrl: payload.event?.mapsUrl || "", clientId, services: payload.commercial?.service || "", status: "Confirmado", team: [], contractUrl: payload.contract?.url || "", contractSigned: Boolean(payload.contract?.signed) }, auth);
      await write("pedidos", `gerador-order-${payload.externalId}`, { integrationId: payload.externalId, clientId, solicitacaoId: `gerador-${payload.externalId}`, servicos: payload.commercial?.service || "", valorTotal: total, parcelas: payload.commercial?.installments || "", status: "Aberto", dadosEvento: requestData.dadosEvento, dataCriacao: new Date().toISOString() }, auth);
    }
    return NextResponse.json({ ok: true, imported: payload.type, externalId: payload.externalId, agendaCreated: payload.type === "contract", message: payload.type === "contract" ? "Contrato recebido: ficha, agenda e financeiro foram criados." : "Proposta recebida no funil comercial." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao importar." }, { status: 502 });
  }
}

export async function GET(request: Request) {
  const pairCode = request.headers.get("x-studio-pair-code");
  const expectedPairCode = process.env.GERADOR_PAIR_CODE || "Melk21";
  if (!pairCode || pairCode !== expectedPairCode) return NextResponse.json({ connected: false, error: "Código de conexão inválido." }, { status: 401 });
  if (!process.env.GERADOR_SYNC_SECRET) return NextResponse.json({ connected: false, error: "A chave interna da integração não está configurada." }, { status: 503 });
  return NextResponse.json({ connected: true, application: "Studio Melk Flow", sync: "ativa" }, { headers: { "cache-control": "no-store" } });
}
