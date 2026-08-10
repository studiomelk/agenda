"use client";

import { useEffect, useState } from "react";

const firebaseConfig = {
  "projectId": "studio-5279929289-498c5",
  "appId": "1:508932506907:web:39fdbb436a570e2a6fbfbe",
  "apiKey": "AIzaSyDpRvSlrfpynbpoCJItut1kfC7ePe9Ym6U",
  "authDomain": "studio-5279929289-498c5.firebaseapp.com",
  "messagingSenderId": "508932506907"
};

type StudioDocument = Record<string, unknown> & { id: string };

export type OriginalStudioData = {
  events: StudioDocument[];
  teamMembers: StudioDocument[];
  clients: StudioDocument[];
  orders: StudioDocument[];
  transactions: StudioDocument[];
  requests: StudioDocument[];
  memos: StudioDocument[];
  contractTemplates: StudioDocument[];
  loading: boolean;
  error: string | null;
  saving: boolean;
  refresh: () => Promise<void>;
  patchDocument: (collectionName: string, id: string, fields: Record<string, unknown>) => Promise<void>;
  createDocument: (collectionName: string, fields: Record<string, unknown>, id?: string) => Promise<string>;
  uploadContract: (file: File, eventId: string) => Promise<string>;
};

const emptyData = {
  events: [] as StudioDocument[], teamMembers: [] as StudioDocument[], clients: [] as StudioDocument[], orders: [] as StudioDocument[], transactions: [] as StudioDocument[],
  requests: [] as StudioDocument[], memos: [] as StudioDocument[], contractTemplates: [] as StudioDocument[], loading: true, error: null as string | null, saving: false,
};

type FirestoreValue = {
  stringValue?: string; integerValue?: string; doubleValue?: number; booleanValue?: boolean;
  timestampValue?: string; nullValue?: null; referenceValue?: string;
  arrayValue?: { values?: FirestoreValue[] }; mapValue?: { fields?: Record<string, FirestoreValue> };
  geoPointValue?: { latitude: number; longitude: number };
};

function decodeValue(value: FirestoreValue): unknown {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("referenceValue" in value) return value.referenceValue;
  if ("geoPointValue" in value) return value.geoPointValue;
  if ("arrayValue" in value) return (value.arrayValue?.values ?? []).map(decodeValue);
  if ("mapValue" in value) return decodeFields(value.mapValue?.fields ?? {});
  return undefined;
}

function decodeFields(fields: Record<string, FirestoreValue>) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeValue(value)]));
}

function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  if (typeof value === "object") return { mapValue: { fields: encodeFields(value as Record<string, unknown>) } };
  return { stringValue: String(value) };
}

function encodeFields(fields: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, encodeValue(value)]));
}

async function anonymousToken(signal: AbortSignal) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ returnSecureToken: true }), signal,
  });
  const data = await response.json() as { idToken?: string; error?: { message?: string } };
  if (!response.ok || !data.idToken) throw new Error(data.error?.message || "Não foi possível autenticar no Firebase original.");
  return data.idToken;
}

async function readCollection(name: string, token: string, signal: AbortSignal) {
  const documents: StudioDocument[] = [];
  let pageToken = "";
  do {
    const suffix = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${name}?pageSize=300${suffix}`, {
      headers: { authorization: `Bearer ${token}` }, signal, cache: "no-store",
    });
    const data = await response.json() as {
      documents?: Array<{ name: string; fields?: Record<string, FirestoreValue> }>;
      nextPageToken?: string; error?: { message?: string };
    };
    if (!response.ok) throw new Error(data.error?.message || `Falha ao ler ${name}.`);
    documents.push(...(data.documents ?? []).map((document) => ({
      id: document.name.split("/").pop() || "", ...decodeFields(document.fields ?? {}),
    })));
    pageToken = data.nextPageToken ?? "";
  } while (pageToken);
  return documents;
}

export function useOriginalStudioData() {
  const [data, setData] = useState(emptyData);
  const [token, setToken] = useState("");
  const collections = {
    events: "events", teamMembers: "team_members", clients: "clientes", orders: "pedidos",
    transactions: "transactions", requests: "solicitacoes", memos: "memos", contractTemplates: "contract_templates",
  } as const;

  const loadAll = async (activeToken: string, signal?: AbortSignal) => {
    const controller = signal ? null : new AbortController();
    const requestSignal = signal ?? controller!.signal;
    const entries = await Promise.all(Object.entries(collections).map(async ([key, name]) => [
      key, await readCollection(name, activeToken, requestSignal),
    ] as const));
    setData((current) => ({ ...current, ...Object.fromEntries(entries), loading: false, error: null }));
  };

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const activeToken = await anonymousToken(controller.signal);
        setToken(activeToken);
        await loadAll(activeToken, controller.signal);
      } catch (error) {
        if (!controller.signal.aborted) setData((current) => ({
          ...current, loading: false, error: error instanceof Error ? error.message : "Falha ao carregar o banco original.",
        }));
      }
    })();

    return () => controller.abort();
  }, []);

  const refresh = async () => {
    if (!token) return;
    setData((current) => ({ ...current, loading: true }));
    await loadAll(token);
  };

  const patchDocument = async (collectionName: string, id: string, fields: Record<string, unknown>) => {
    if (!token) throw new Error("Banco ainda não conectado.");
    setData((current) => ({ ...current, saving: true, error: null }));
    const masks = Object.keys(fields).map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`).join("&");
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collectionName}/${encodeURIComponent(id)}?${masks}`, {
      method: "PATCH", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ fields: encodeFields(fields) }),
    });
    const result = await response.json() as { error?: { message?: string } };
    if (!response.ok) {
      setData((current) => ({ ...current, saving: false, error: result.error?.message || "Falha ao salvar." }));
      throw new Error(result.error?.message || "Falha ao salvar.");
    }
    await loadAll(token);
    setData((current) => ({ ...current, saving: false }));
  };

  const createDocument = async (collectionName: string, fields: Record<string, unknown>, id = `${collectionName}-${Date.now()}`) => {
    if (!token) throw new Error("Banco ainda não conectado.");
    setData((current) => ({ ...current, saving: true, error: null }));
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${collectionName}?documentId=${encodeURIComponent(id)}`, {
      method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ fields: encodeFields({ id, ...fields }) }),
    });
    const result = await response.json() as { error?: { message?: string } };
    if (!response.ok) {
      setData((current) => ({ ...current, saving: false, error: result.error?.message || "Falha ao criar cadastro." }));
      throw new Error(result.error?.message || "Falha ao criar cadastro.");
    }
    await loadAll(token);
    setData((current) => ({ ...current, saving: false }));
    return id;
  };

  const uploadContract = async (file: File, eventId: string) => {
    if (!token) throw new Error("Banco ainda não conectado.");
    if (file.type !== "application/pdf") throw new Error("Selecione um arquivo PDF.");
    if (file.size > 15 * 1024 * 1024) throw new Error("O PDF deve ter no máximo 15 MB.");
    const objectName = `contracts/${eventId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    const buckets = [`${firebaseConfig.projectId}.firebasestorage.app`, `${firebaseConfig.projectId}.appspot.com`];
    let lastError = "Armazenamento de contratos não disponível.";
    for (const bucket of buckets) {
      const response = await fetch(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(objectName)}`, {
        method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/pdf" }, body: file,
      });
      const result = await response.json() as { name?: string; downloadTokens?: string; error?: { message?: string } };
      if (!response.ok || !result.name) { lastError = result.error?.message || lastError; continue; }
      const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(result.name)}?alt=media${result.downloadTokens ? `&token=${result.downloadTokens.split(",")[0]}` : ""}`;
      await patchDocument("events", eventId, { contractUrl: downloadUrl, contractFileName: file.name, contractSigned: false, contractUploadedAt: new Date().toISOString() });
      return downloadUrl;
    }
    throw new Error(lastError);
  };

  return { ...data, refresh, patchDocument, createDocument, uploadContract } satisfies OriginalStudioData;
}
