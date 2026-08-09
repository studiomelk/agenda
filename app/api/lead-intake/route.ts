import { NextResponse } from "next/server";
import { validateProposalLeadPayload } from "../../../lib/lead-intake";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  if (!validateProposalLeadPayload(payload)) {
    return NextResponse.json({ error: "Envie source e lead.name." }, { status: 400 });
  }

  // Segurança da fase de desenvolvimento: nenhum dado é persistido ainda.
  // A próxima etapa conectará esta rota ao Firestore com autenticação e regras revisadas.
  return NextResponse.json({
    accepted: false,
    mode: "development",
    message: "Payload validado. Persistência ainda desativada para proteger os dados existentes.",
  }, { status: 202 });
}
