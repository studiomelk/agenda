import { NextResponse } from "next/server";
import { DefaultSignatureProvider } from "@/lib/signature-provider";

export const dynamic = "force-dynamic";

const activeSignatureProvider = new DefaultSignatureProvider();

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({})) as {
      contractId?: string;
      title?: string;
      signerName?: string;
      signerEmail?: string;
      signerPhone?: string;
    };

    const title = body.title || `Contrato Studio Melk — ${body.signerName || "Cliente"}`;
    const result = await activeSignatureProvider.createDocument({
      title,
      signers: [
        {
          name: body.signerName || "Cliente",
          email: body.signerEmail || "cliente@exemplo.com",
          phone: body.signerPhone || "",
        },
      ],
    });

    return NextResponse.json({
      ok: true,
      provider: activeSignatureProvider.name,
      documentId: result.documentId,
      signUrl: result.signUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro ao gerar link de assinatura" },
      { status: 500 }
    );
  }
}
