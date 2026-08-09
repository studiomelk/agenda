export type LeadStage =
  | "Novo lead"
  | "Contato feito"
  | "Qualificado"
  | "Proposta em preparo"
  | "Proposta enviada"
  | "Negociação"
  | "Aceita"
  | "Contrato enviado"
  | "Contrato assinado"
  | "Sinal pago"
  | "Evento confirmado"
  | "Em produção"
  | "Entregue"
  | "Pós-venda";

export type ProposalLeadPayload = {
  source: "proposal" | "form" | "whatsapp" | "manual";
  lead: { name: string; whatsapp?: string; email?: string };
  event: { type?: string; date?: string; city?: string };
  proposal?: { id?: string; url?: string; total?: number; items?: string[] };
};

export const leadStages: LeadStage[] = [
  "Novo lead", "Contato feito", "Qualificado", "Proposta em preparo", "Proposta enviada",
  "Negociação", "Aceita", "Contrato enviado", "Contrato assinado", "Sinal pago",
  "Evento confirmado", "Em produção", "Entregue", "Pós-venda",
];

export function validateProposalLeadPayload(payload: unknown): payload is ProposalLeadPayload {
  if (!payload || typeof payload !== "object") return false;
  const value = payload as Partial<ProposalLeadPayload>;
  return Boolean(value.source && value.lead && typeof value.lead.name === "string");
}
