import { createSign } from "node:crypto";
import { encryptToken, decryptToken } from "./google-crypto";

const projectId = process.env.FIREBASE_PROJECT_ID || "studio-5279929289-498c5";
const apiKey = process.env.FIREBASE_WEB_API_KEY || "";
const tokenUrl = "https://oauth2.googleapis.com/token";
const firestoreScope = "https://www.googleapis.com/auth/datastore";

export type GoogleTokenData = {
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
  email?: string;
  scope?: string;
  updated_at: string;
};

export type EventDetailsInput = {
  noiva?: string;
  noivo?: string;
  nomeContratante?: string;
  whatsapp?: string;
  email?: string;
  dataEvento?: string;
  horario?: string;
  local?: string;
  endereco?: string;
  servicos?: string;
  valorTotal?: string;
  statusContrato?: string;
  statusAssinatura?: string;
  statusFinanceiro?: string;
  linkContrato?: string;
  linkAssinatura?: string;
  observacoes?: string;
  googleMapsUrl?: string;
};

function serviceAccount() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return clientEmail && privateKey ? { clientEmail, privateKey } : null;
}

async function getFirestoreAuthToken(): Promise<string> {
  const sa = serviceAccount();
  if (sa) {
    const now = Math.floor(Date.now() / 1000);
    const encodePart = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const header = encodePart({ alg: "RS256", typ: "JWT" });
    const claim = encodePart({ iss: sa.clientEmail, scope: firestoreScope, aud: tokenUrl, iat: now, exp: now + 3600 });
    const signer = createSign("RSA-SHA256");
    signer.update(`${header}.${claim}`);
    signer.end();
    const assertion = `${header}.${claim}.${signer.sign(sa.privateKey).toString("base64url")}`;
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
      cache: "no-store",
    });
    const body = await response.json() as { access_token?: string };
    if (!response.ok || !body.access_token) throw new Error("Falha na autenticação do service account no Firestore.");
    return body.access_token;
  }
  if (!apiKey) throw new Error("Nenhuma credencial do Firestore disponível.");
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }), cache: "no-store",
  });
  const body = await response.json() as { idToken?: string };
  if (!response.ok || !body.idToken) throw new Error("Falha na autenticação anônima do Firestore.");
  return body.idToken;
}

function encodeFirestoreFields(data: Record<string, unknown>) {
  const encode = (val: unknown): Record<string, unknown> => {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === "string") return { stringValue: val };
    if (typeof val === "boolean") return { booleanValue: val };
    if (typeof val === "number") return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    if (Array.isArray(val)) return { arrayValue: { values: val.map(encode) } };
    return { mapValue: { fields: encodeFirestoreFields(val as Record<string, unknown>) } };
  };
  return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, encode(v)]));
}

function decodeFirestoreFields(fields: Record<string, unknown>): Record<string, unknown> {
  const decode = (val: unknown): unknown => {
    if (!val || typeof val !== "object") return undefined;
    const item = val as Record<string, unknown>;
    if ("stringValue" in item) return item.stringValue;
    if ("integerValue" in item) return Number(item.integerValue);
    if ("doubleValue" in item) return item.doubleValue;
    if ("booleanValue" in item) return item.booleanValue;
    if ("nullValue" in item) return null;
    if ("arrayValue" in item) return ((item.arrayValue as { values?: unknown[] })?.values ?? []).map(decode);
    if ("mapValue" in item) return decodeFirestoreFields((item.mapValue as { fields?: Record<string, unknown> })?.fields ?? {});
    return undefined;
  };
  return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decode(v)]));
}

// Global in-memory token cache for environments without persistent Firestore or as fallback
let memoryTokenStore: GoogleTokenData | null = null;

export async function saveGoogleTokens(tokens: GoogleTokenData): Promise<void> {
  memoryTokenStore = tokens;
  try {
    const authToken = await getFirestoreAuthToken();
    const docData: Record<string, unknown> = {
      access_token: tokens.access_token,
      expiry_date: tokens.expiry_date,
      email: tokens.email || "",
      scope: tokens.scope || "",
      updated_at: tokens.updated_at,
    };
    if (tokens.refresh_token) {
      docData.refresh_token_encrypted = encryptToken(tokens.refresh_token);
    }
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/google_oauth`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${authToken}`, "content-type": "application/json" },
      body: JSON.stringify({ fields: encodeFirestoreFields(docData) }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.warn("Aviso ao salvar tokens no Firestore:", await response.text());
    }
  } catch (err) {
    console.warn("Firestore indisponível para salvar tokens Google. Mantendo em memória.", err);
  }
}

export async function loadGoogleTokens(): Promise<GoogleTokenData | null> {
  try {
    const authToken = await getFirestoreAuthToken();
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/google_oauth`, {
      headers: { authorization: `Bearer ${authToken}` },
      cache: "no-store",
    });
    if (response.ok) {
      const body = await response.json() as { fields?: Record<string, unknown> };
      if (body.fields) {
        const decoded = decodeFirestoreFields(body.fields);
        let refreshToken: string | undefined = undefined;
        if (decoded.refresh_token_encrypted) {
          refreshToken = decryptToken(String(decoded.refresh_token_encrypted)) || undefined;
        }
        const tokens: GoogleTokenData = {
          access_token: String(decoded.access_token || ""),
          refresh_token: refreshToken || memoryTokenStore?.refresh_token,
          expiry_date: Number(decoded.expiry_date || 0),
          email: String(decoded.email || ""),
          scope: String(decoded.scope || ""),
          updated_at: String(decoded.updated_at || ""),
        };
        if (tokens.access_token) {
          memoryTokenStore = tokens;
          return tokens;
        }
      }
    }
  } catch (err) {
    console.warn("Erro ao carregar tokens do Firestore, utilizando cache de memória:", err);
  }
  return memoryTokenStore;
}

export async function deleteGoogleTokens(): Promise<void> {
  memoryTokenStore = null;
  try {
    const authToken = await getFirestoreAuthToken();
    await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/google_oauth`, {
      method: "DELETE",
      headers: { authorization: `Bearer ${authToken}` },
      cache: "no-store",
    });
  } catch (err) {
    console.warn("Erro ao deletar tokens do Firestore:", err);
  }
}

export async function refreshAccessTokenIfNeeded(): Promise<string> {
  const tokens = await loadGoogleTokens();
  if (!tokens) throw new Error("Conta Google Agenda não está conectada.");

  const now = Date.now();
  // If access token is valid for more than 2 minutes, return it
  if (tokens.access_token && tokens.expiry_date > now + 120000) {
    return tokens.access_token;
  }

  if (!tokens.refresh_token) {
    if (tokens.access_token) return tokens.access_token;
    throw new Error("Refresh token não disponível. Reconecte sua conta Google Agenda.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Credenciais GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET não configuradas.");
  }

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  const body = await response.json() as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`Falha ao renovar token Google: ${body.error_description || body.error || response.statusText}`);
  }

  const updatedTokens: GoogleTokenData = {
    ...tokens,
    access_token: body.access_token,
    expiry_date: Date.now() + (body.expires_in || 3600) * 1000,
    updated_at: new Date().toISOString(),
  };

  await saveGoogleTokens(updatedTokens);
  return updatedTokens.access_token;
}

export function buildEventDescription(input: EventDetailsInput): string {
  const noiva = input.noiva || "—";
  const noivo = input.noivo || "—";
  const nomeContratante = input.nomeContratante || "—";
  const whatsapp = input.whatsapp || "—";
  const email = input.email || "—";
  const dataEvento = input.dataEvento || "—";
  const horario = input.horario || "—";
  const local = input.local || "—";
  const endereco = input.endereco || "—";
  const servicos = input.servicos || "—";
  const valorTotal = input.valorTotal || "—";
  const statusContrato = input.statusContrato || "Confirmado";
  const statusAssinatura = input.statusAssinatura || "Pendente";
  const statusFinanceiro = input.statusFinanceiro || "Pendente";
  const linkContrato = input.linkContrato || "—";
  const linkAssinatura = input.linkAssinatura || "—";
  const observacoes = input.observacoes || "—";

  let desc = `STUDIO MELK FOTO E FILME

CASAL
${noiva} + ${noivo}

CONTRATANTE
${nomeContratante}

WHATSAPP
${whatsapp}

E-MAIL
${email}

DATA
${dataEvento}

HORÁRIO
${horario}

LOCAL
${local}

ENDEREÇO
${endereco}

SERVIÇOS
${servicos}

VALOR DO CONTRATO
${valorTotal}

STATUS DO CONTRATO
${statusContrato}

STATUS DA ASSINATURA
${statusAssinatura}

STATUS FINANCEIRO
${statusFinanceiro}

LINK DO CONTRATO
${linkContrato}

LINK DE ASSINATURA
${linkAssinatura}

OBSERVAÇÕES
${observacoes}

STUDIO MELK FOTO E FILME`;

  if (input.googleMapsUrl && input.googleMapsUrl.trim()) {
    desc += `\n\nMAPA DE LOCALIZAÇÃO\n${input.googleMapsUrl.trim()}`;
  }

  return desc;
}

export function buildEventTitle(noiva?: string, noivo?: string): string {
  if (noiva && noivo) return `CASAMENTO — ${noiva} + ${noivo}`;
  if (noiva) return `CASAMENTO — ${noiva}`;
  if (noivo) return `CASAMENTO — ${noivo}`;
  return `CASAMENTO — STUDIO MELK`;
}
