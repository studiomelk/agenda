import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  return NextResponse.json({
    documentId: id,
    status: "pending",
    title: "Contrato de Prestação de Serviços de Fotografia e Filmagem — Studio Melk",
    clientName: "Cliente Studio Melk",
    viewUrl: `/assinar/${id}`,
  });
}
