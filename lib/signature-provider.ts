export interface SignatureProvider {
  name: string;
  createDocument(params: {
    title: string;
    pdfUrlOrBuffer?: string;
    signers: Array<{ name: string; email: string; phone?: string }>;
  }): Promise<{ documentId: string; signUrl: string }>;
  getStatus(documentId: string): Promise<{ status: "pending" | "signed" | "canceled"; signedAt?: string }>;
}

export class DefaultSignatureProvider implements SignatureProvider {
  name = "StudioMelkPrivateSignature";

  async createDocument(params: {
    title: string;
    signers: Array<{ name: string; email: string; phone?: string }>;
  }) {
    const documentId = `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const host = process.env.APP_BASE_URL || "https://agenda-studiomelk.vercel.app";
    const signUrl = `${host}/assinar/${documentId}`;

    return { documentId, signUrl };
  }

  async getStatus(documentId: string) {
    return { status: "pending" as const };
  }
}
