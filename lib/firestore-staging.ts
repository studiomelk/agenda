import { createSign } from "node:crypto";
import { normalizeGeneratorRequest, type GeneratorRequest } from "./solicitacao-normalizer";

const databaseId = "manager-next-staging";
const tokenUrl = "https://oauth2.googleapis.com/token";
const firestoreScope = "https://www.googleapis.com/auth/datastore";

type ServiceAccount = {
  projectId: string;
  clientEmail: string;
  privateKey: string;
};

function credentials(): ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return projectId && clientEmail && privateKey ? { projectId, clientEmail, privateKey } : null;
}

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

async function accessToken(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({
    iss: account.clientEmail,
    scope: firestoreScope,
    aud: tokenUrl,
    iat: now,
    exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  signer.end();
  const signature = signer.sign(account.privateKey).toString("base64url");
  const assertion = `${header}.${claim}.${signature}`;
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Não foi possível autenticar a leitura privada.");
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("Token privado não recebido.");
  return data.access_token;
}

function fieldValue(value: unknown): unknown {
  if (!value || typeof value !== "object") return undefined;
  const field = value as Record<string, unknown>;
  if ("stringValue" in field) return field.stringValue;
  if ("integerValue" in field) return field.integerValue;
  if ("doubleValue" in field) return field.doubleValue;
  if ("booleanValue" in field) return field.booleanValue;
  if ("mapValue" in field) {
    const fields = (field.mapValue as { fields?: Record<string, unknown> }).fields ?? {};
    return Object.fromEntries(Object.entries(fields).map(([key, nested]) => [key, fieldValue(nested)]));
  }
  return undefined;
}

function decodeDocument(document: { name?: string; fields?: Record<string, unknown> }): GeneratorRequest {
  const values = Object.fromEntries(Object.entries(document.fields ?? {}).map(([key, value]) => [key, fieldValue(value)]));
  const id = values.id || document.name?.split("/").pop() || "sem-id";
  return { ...values, id: String(id) } as GeneratorRequest;
}

export async function readStagingRequests() {
  const account = credentials();
  if (!account) return { configured: false as const, records: [] };
  const token = await accessToken(account);
  const url = `https://firestore.googleapis.com/v1/projects/${account.projectId}/databases/${databaseId}/documents/solicitacoes?pageSize=100`;
  const response = await fetch(url, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!response.ok) throw new Error("Não foi possível ler o banco de staging.");
  const body = await response.json() as { documents?: Array<{ name?: string; fields?: Record<string, unknown> }> };
  return { configured: true as const, records: (body.documents ?? []).map(decodeDocument).map(normalizeGeneratorRequest) };
}
