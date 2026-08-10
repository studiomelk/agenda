/**
 * Boundary between the proposal generator and Manager Next.
 *
 * The source record stays in the protected database. This module only maps its
 * existing shape to the operations model; it deliberately never persists a
 * client record in the public frontend repository.
 */
export type GeneratorRequest = {
  id: string;
  criadoEm?: string;
  status?: string;
  tipoEvento?: string;
  dadosContratante?: { nome?: string; email?: string; whatsapp?: string };
  dadosEvento?: { titulo?: string; data?: string; horario?: string; local?: string; localFesta?: string };
  dadosComerciais?: { servico?: string; valorTotal?: string; formaPagamento?: string; parcelas?: string; dataVencimento?: string };
};

export type ImportedLead = {
  externalId: string;
  displayName: string;
  eventTitle: string;
  eventDate?: string;
  eventTime?: string;
  venue?: string;
  service?: string;
  total?: string;
  paymentMethod?: string;
  installments?: string;
  dueDate?: string;
  clientEmail?: string;
  clientPhone?: string;
  eventLocation?: string;
  source: "Gerador";
  stage: "Novo lead" | "Qualificado" | "Proposta enviada" | "Negociação" | "Aceita";
};

const stageFromStatus = (status?: string): ImportedLead["stage"] => {
  const value = status?.trim().toLowerCase() ?? "";
  if (value.includes("aceit") || value.includes("aprov")) return "Aceita";
  if (value.includes("negoc")) return "Negociação";
  if (value.includes("enviad")) return "Proposta enviada";
  if (value.includes("qualif")) return "Qualificado";
  return "Novo lead";
};

export function normalizeGeneratorRequest(request: GeneratorRequest): ImportedLead {
  const event = request.dadosEvento ?? {};
  const business = request.dadosComerciais ?? {};
  const client = request.dadosContratante ?? {};
  return {
    externalId: request.id,
    displayName: client.nome?.trim() || "Cliente sem nome",
    eventTitle: event.titulo?.trim() || request.tipoEvento?.trim() || "Evento sem título",
    eventDate: event.data,
    eventTime: event.horario,
    venue: event.local?.trim() || event.localFesta?.trim(),
    service: business.servico?.trim(),
    total: business.valorTotal,
    paymentMethod: business.formaPagamento,
    installments: business.parcelas,
    dueDate: business.dataVencimento,
    clientEmail: client.email?.trim(),
    clientPhone: client.whatsapp?.trim(),
    eventLocation: event.local?.trim() || event.localFesta?.trim(),
    source: "Gerador",
    stage: stageFromStatus(request.status),
  };
}

/** Data that is safe to show in a deploy: counts and schema state only. */
export type ImportReadiness = {
  source: "Firebase · manager-next-staging";
  recordsFound: number;
  fieldsReady: string[];
  mode: "protected-staging";
};

export const importReadiness: ImportReadiness = {
  source: "Firebase · manager-next-staging",
  recordsFound: 5,
  fieldsReady: ["cliente", "evento", "proposta", "parcelas", "status"],
  mode: "protected-staging",
};
